-- ============================================================
-- Learning Platform with AI Doubt Solver
-- PostgreSQL Schema (Phase 1)
-- ============================================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE content_type AS ENUM ('text', 'pdf', 'video', 'slide', 'link');
CREATE TYPE doubt_status AS ENUM ('pending', 'answered', 'escalated');

-- ============================================================
-- TABLES
-- ============================================================

-- Users: students, instructors, and admins
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  UNIQUE NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    role          user_role     NOT NULL DEFAULT 'student',
    created_at    TIMESTAMP     DEFAULT NOW()
);

-- Courses created by instructors
CREATE TABLE courses (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(150)  NOT NULL,
    description   TEXT,
    instructor_id INTEGER       REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMP     DEFAULT NOW()
);

-- Student → Course enrollments (many-to-many)
CREATE TABLE enrollments (
    id          SERIAL PRIMARY KEY,
    student_id  INTEGER   REFERENCES users(id)   ON DELETE CASCADE,
    course_id   INTEGER   REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- Modules are ordered sections within a course
CREATE TABLE modules (
    id          SERIAL PRIMARY KEY,
    course_id   INTEGER      REFERENCES courses(id) ON DELETE CASCADE,
    title       VARCHAR(150) NOT NULL,
    order_index INTEGER      DEFAULT 0,
    created_at  TIMESTAMP    DEFAULT NOW()
);

-- Content items within a module (text chunks, PDFs, videos, etc.)
CREATE TABLE course_content (
    id           SERIAL PRIMARY KEY,
    module_id    INTEGER      REFERENCES modules(id) ON DELETE CASCADE,
    title        VARCHAR(150) NOT NULL,
    content_type content_type NOT NULL,
    content_text TEXT,          -- for text-based chunks
    file_url     VARCHAR(255),  -- for pdf/video/slide assets (stored in MongoDB/blob)
    created_at   TIMESTAMP    DEFAULT NOW()
);

-- Student doubts, linked to a specific course and optionally a module
CREATE TABLE doubts (
    id            SERIAL PRIMARY KEY,
    student_id    INTEGER       REFERENCES users(id)   ON DELETE CASCADE,
    course_id     INTEGER       REFERENCES courses(id) ON DELETE SET NULL,
    module_id     INTEGER       REFERENCES modules(id) ON DELETE SET NULL,
    question_text TEXT          NOT NULL,
    status        doubt_status  DEFAULT 'pending',
    created_at    TIMESTAMP     DEFAULT NOW()
);

-- AI-generated (or instructor) responses to doubts
CREATE TABLE doubt_responses (
    id               SERIAL PRIMARY KEY,
    doubt_id         INTEGER REFERENCES doubts(id) ON DELETE CASCADE,
    answer_text      TEXT    NOT NULL,
    confidence_score FLOAT,           -- 0.0–1.0; null for instructor answers
    generated_at     TIMESTAMP DEFAULT NOW()
);

-- Which course content chunks were used to generate a response (RAG sources)
CREATE TABLE doubt_response_sources (
    id                SERIAL PRIMARY KEY,
    doubt_response_id INTEGER REFERENCES doubt_responses(id) ON DELETE CASCADE,
    content_id        INTEGER REFERENCES course_content(id)  ON DELETE CASCADE
);

-- pgvector: semantic embeddings over course content chunks
-- Used by the AI retrieval pipeline to find relevant content for a doubt
CREATE TABLE content_embeddings (
    id         SERIAL PRIMARY KEY,
    content_id INTEGER  REFERENCES course_content(id) ON DELETE CASCADE,
    chunk_text TEXT     NOT NULL,
    embedding  VECTOR(1536),          -- OpenAI text-embedding-ada-002 dimensions
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_enrollments_student  ON enrollments(student_id);
CREATE INDEX idx_enrollments_course   ON enrollments(course_id);
CREATE INDEX idx_modules_course       ON modules(course_id);
CREATE INDEX idx_content_module       ON course_content(module_id);
CREATE INDEX idx_doubts_student       ON doubts(student_id);
CREATE INDEX idx_doubts_course        ON doubts(course_id);
CREATE INDEX idx_doubts_status        ON doubts(status);
CREATE INDEX idx_responses_doubt      ON doubt_responses(doubt_id);
CREATE INDEX idx_sources_response     ON doubt_response_sources(doubt_response_id);
CREATE INDEX idx_embeddings_content   ON content_embeddings(content_id);

-- Vector similarity index (IVFFlat — build after bulk insert)
-- CREATE INDEX ON content_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- PHASE 2 — ADVANCED SQL OBJECTS
-- ============================================================

-- TRIGGER: auto-update doubt status to 'answered' when a response is inserted
-- CO1 Evidence: trigger fires AFTER INSERT on doubt_responses, updating the
-- parent doubts row atomically within the same transaction.
CREATE OR REPLACE FUNCTION mark_doubt_answered() RETURNS TRIGGER AS $$
BEGIN
    UPDATE doubts SET status = 'answered' WHERE id = NEW.doubt_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mark_doubt_answered
AFTER INSERT ON doubt_responses
FOR EACH ROW EXECUTE FUNCTION mark_doubt_answered();

-- STORED PROCEDURE: enroll a student transactionally, rejecting duplicates cleanly
-- CO1 Evidence: uses procedural SQL with an existence check to make the
-- INSERT idempotent — safe to call repeatedly without raising UNIQUE violations.
CREATE OR REPLACE PROCEDURE enroll_student(p_student_id INT, p_course_id INT)
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM enrollments
        WHERE student_id = p_student_id AND course_id = p_course_id
    ) THEN
        INSERT INTO enrollments (student_id, course_id)
        VALUES (p_student_id, p_course_id);
    END IF;
END;
$$;

-- VIEW: doubt analytics per course, for the instructor dashboard
-- CO1 Evidence: aggregated view using COUNT with FILTER, LEFT JOIN to include
-- courses with zero doubts, grouped by course.
CREATE OR REPLACE VIEW course_doubt_analytics AS
SELECT
    c.id    AS course_id,
    c.title,
    COUNT(d.id)                                                AS total_doubts,
    COUNT(d.id) FILTER (WHERE d.status = 'pending')           AS pending_doubts,
    COUNT(d.id) FILTER (WHERE d.status = 'answered')          AS answered_doubts,
    COUNT(d.id) FILTER (WHERE d.status = 'escalated')         AS escalated_doubts
FROM courses c
LEFT JOIN doubts d ON d.course_id = c.id
GROUP BY c.id, c.title;

-- ============================================================
-- SCHEMA EXTENSION: Real Courses Attributes & Idempotent Upsert Indexes
-- ============================================================
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_code VARCHAR(20) UNIQUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS credits INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS coordinator VARCHAR(150);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisite VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uq_modules_course_title ON modules(course_id, title);
CREATE UNIQUE INDEX IF NOT EXISTS uq_course_content_module_title ON course_content(module_id, title);

