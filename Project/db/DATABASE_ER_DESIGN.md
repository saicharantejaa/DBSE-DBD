# Database Design & Entity-Relationship (ER) Documentation
## Learning Platform with AI Doubt Solver (DBSE Project)

---

## 1. Overview & Architecture

The database architecture employs a **Polyglot Persistence** model designed to handle structured academic data, high-dimensional vector embeddings for AI semantic search, and unstructured media assets:

1. **PostgreSQL (Relational Core + pgvector)**:
   - Manages transactional business logic with strict ACID guarantees (Users, Courses, Enrollments, Modules, Content chunks, Doubts, AI/Instructor Responses, and Citation Sources).
   - Utilizes the `pgvector` extension to store 1536-dimensional OpenAI embeddings directly inside PostgreSQL (`content_embeddings`), eliminating the need for an external vector database and preserving referential integrity.
2. **MongoDB (Document Store)**:
   - Manages heterogeneous, schema-less media metadata (`course_assets` with variable video/pdf/slide details) and user-submitted binary attachments (`doubt_attachments`).

---

## 2. Comprehensive ER Diagram (Crow's Foot Notation)

This diagram illustrates all entities, attributes, primary keys (`PK`), foreign keys (`FK`), and cardinality relationships.

```mermaid
erDiagram
    %% ==========================================
    %% POSTGRESQL RELATIONAL ENTITIES
    %% ==========================================

    USERS {
        int id PK "SERIAL"
        varchar name "100, NOT NULL"
        varchar email "150, UNIQUE, NOT NULL"
        varchar password_hash "255, NOT NULL"
        user_role role "ENUM: student | instructor | admin"
        timestamp created_at "DEFAULT NOW()"
    }

    COURSES {
        int id PK "SERIAL"
        varchar title "150, NOT NULL"
        text description "TEXT"
        int instructor_id FK "REFERENCES users(id) ON DELETE SET NULL"
        timestamp created_at "DEFAULT NOW()"
    }

    ENROLLMENTS {
        int id PK "SERIAL"
        int student_id FK "REFERENCES users(id) ON DELETE CASCADE"
        int course_id FK "REFERENCES courses(id) ON DELETE CASCADE"
        timestamp enrolled_at "DEFAULT NOW()"
    }

    MODULES {
        int id PK "SERIAL"
        int course_id FK "REFERENCES courses(id) ON DELETE CASCADE"
        varchar title "150, NOT NULL"
        int order_index "DEFAULT 0"
        timestamp created_at "DEFAULT NOW()"
    }

    COURSE_CONTENT {
        int id PK "SERIAL"
        int module_id FK "REFERENCES modules(id) ON DELETE CASCADE"
        varchar title "150, NOT NULL"
        content_type content_type "ENUM: text | pdf | video | slide | link"
        text content_text "TEXT (for text chunks/transcripts)"
        varchar file_url "255 (asset reference)"
        timestamp created_at "DEFAULT NOW()"
    }

    CONTENT_EMBEDDINGS {
        int id PK "SERIAL"
        int content_id FK "REFERENCES course_content(id) ON DELETE CASCADE"
        text chunk_text "NOT NULL"
        vector embedding "VECTOR(1536) - OpenAI ada-002"
        timestamp created_at "DEFAULT NOW()"
    }

    DOUBTS {
        int id PK "SERIAL"
        int student_id FK "REFERENCES users(id) ON DELETE CASCADE"
        int course_id FK "REFERENCES courses(id) ON DELETE SET NULL"
        int module_id FK "REFERENCES modules(id) ON DELETE SET NULL"
        text question_text "NOT NULL"
        doubt_status status "ENUM: pending | answered | escalated"
        timestamp created_at "DEFAULT NOW()"
    }

    DOUBT_RESPONSES {
        int id PK "SERIAL"
        int doubt_id FK "REFERENCES doubts(id) ON DELETE CASCADE"
        text answer_text "NOT NULL"
        float confidence_score "0.0 - 1.0 (NULL for manual answers)"
        timestamp generated_at "DEFAULT NOW()"
    }

    DOUBT_RESPONSE_SOURCES {
        int id PK "SERIAL"
        int doubt_response_id FK "REFERENCES doubt_responses(id) ON DELETE CASCADE"
        int content_id FK "REFERENCES course_content(id) ON DELETE CASCADE"
    }

    %% ==========================================
    %% MONGODB DOCUMENT COLLECTIONS
    %% ==========================================

    COURSE_ASSETS {
        ObjectId _id PK "Mongo ObjectID"
        int courseId "Ref Postgres courses.id"
        int moduleId "Ref Postgres modules.id"
        string type "video | pdf | slide | note"
        string title "Asset title"
        string url "CDN / S3 Bucket URL"
        string_array tags "e.g. ['dbms', 'sql', 'b-tree']"
        int uploadedBy "Ref Postgres users.id"
        object metadata "Flexible JSON: duration, resolution, pages, etc."
        timestamp createdAt "Timestamp"
        timestamp updatedAt "Timestamp"
    }

    DOUBT_ATTACHMENTS {
        ObjectId _id PK "Mongo ObjectID"
        int doubtId "Ref Postgres doubts.id"
        string fileUrl "CDN / S3 Bucket URL"
        string fileType "MIME type: image/png, application/pdf"
        timestamp uploadedAt "Timestamp"
    }

    %% ==========================================
    %% RELATIONSHIPS & CARDINALITY
    %% ==========================================

    USERS ||--o{ COURSES : "creates / teaches (1:N)"
    USERS ||--o{ ENROLLMENTS : "registers (1:N)"
    COURSES ||--o{ ENROLLMENTS : "has enrolled students (1:N)"

    COURSES ||--o{ MODULES : "contains ordered sections (1:N)"
    MODULES ||--o{ COURSE_CONTENT : "groups learning units (1:N)"
    COURSE_CONTENT ||--o{ CONTENT_EMBEDDINGS : "vectorized into chunks (1:N)"

    USERS ||--o{ DOUBTS : "asks (1:N)"
    COURSES ||--o{ DOUBTS : "categorizes doubt (1:N)"
    MODULES ||--o{ DOUBTS : "scoped to optional module (1:N)"

    DOUBTS ||--o{ DOUBT_RESPONSES : "receives AI/Instructor reply (1:N)"
    DOUBT_RESPONSES ||--o{ DOUBT_RESPONSE_SOURCES : "cites RAG context (1:N)"
    COURSE_CONTENT ||--o{ DOUBT_RESPONSE_SOURCES : "referenced as source (1:N)"

    %% Cross-Database Logical Relationships
    COURSES ..o{ COURSE_ASSETS : "stores media files [MongoDB]"
    MODULES ..o{ COURSE_ASSETS : "groups media assets [MongoDB]"
    DOUBTS ..o{ DOUBT_ATTACHMENTS : "stores screenshot/log files [MongoDB]"
```

---

## 3. Conceptual ER Model (Entities, Attributes & Constraints)

### A. Entity Classifications

| Entity Type | Entity Name | Description |
|---|---|---|
| **Strong Entity** | `USERS` | Independent master entity storing user credentials and roles. |
| **Strong Entity** | `COURSES` | Independent entity representing educational courses created by instructors. |
| **Weak / Associative Entity** | `ENROLLMENTS` | Resolves Many-to-Many ($M:N$) relationship between `USERS` and `COURSES`. |
| **Strong Entity** | `MODULES` | Child entity of `COURSES` representing structured sections. |
| **Strong Entity** | `COURSE_CONTENT` | Granular learning items (texts, lecture transcripts, slide references). |
| **Dependent Entity** | `CONTENT_EMBEDDINGS` | Vector chunks tied directly to `COURSE_CONTENT` for semantic RAG lookup. |
| **Strong Entity** | `DOUBTS` | Student inquiry linked to a course and optional module. |
| **Dependent Entity** | `DOUBT_RESPONSES` | Answers generated either by the AI solver or submitted by an instructor. |
| **Associative Entity** | `DOUBT_RESPONSE_SOURCES` | Resolves Many-to-Many ($M:N$) citation link between `DOUBT_RESPONSES` and `COURSE_CONTENT`. |
| **Document Entity (NoSQL)** | `COURSE_ASSETS` | Dynamic media file descriptors with polymorphic metadata. |
| **Document Entity (NoSQL)** | `DOUBT_ATTACHMENTS` | Student-submitted image/log files providing visual context for doubts. |

---

## 4. Detailed Cardinality & Participation Constraints

| Relationship Name | Participating Entities | Cardinality | Participation | Structural Business Rule |
|---|---|---|---|---|
| **Teaches** | `USERS` $\leftrightarrow$ `COURSES` | $1 : N$ | Partial on USERS, Partial on COURSES (`ON DELETE SET NULL`) | An instructor can create zero, one, or many courses. A course belongs to at most one instructor. |
| **Enrolls** | `USERS` $\leftrightarrow$ `COURSES` | $M : N$ via `ENROLLMENTS` | Partial on both sides | A student can enroll in multiple courses. A course has multiple enrolled students. Enforced unique per `(student_id, course_id)`. |
| **Contains Module** | `COURSES` $\leftrightarrow$ `MODULES` | $1 : N$ | Total on MODULES (`ON DELETE CASCADE`) | A course has 0 or more modules. Each module must strictly belong to one course. |
| **Contains Content** | `MODULES` $\leftrightarrow$ `COURSE_CONTENT` | $1 : N$ | Total on COURSE_CONTENT (`ON DELETE CASCADE`) | A module contains 0 or more content chunks. Each chunk belongs to exactly one module. |
| **Vectorizes** | `COURSE_CONTENT` $\leftrightarrow$ `CONTENT_EMBEDDINGS` | $1 : N$ | Total on CONTENT_EMBEDDINGS (`ON DELETE CASCADE`) | A content item is partitioned into one or more vector chunks (1536 dimensions) for semantic retrieval. |
| **Raises Doubt** | `USERS` $\leftrightarrow$ `DOUBTS` | $1 : N$ | Total on DOUBTS (`ON DELETE CASCADE`) | A student can raise multiple doubts. Every doubt must be associated with a valid student. |
| **Categorizes Doubt** | `COURSES` $\leftrightarrow$ `DOUBTS` | $1 : N$ | Partial on DOUBTS (`ON DELETE SET NULL`) | A doubt is linked to a course context so retrieval only searches that course. |
| **Scopes Doubt** | `MODULES` $\leftrightarrow$ `DOUBTS` | $1 : N$ | Optional/Partial on DOUBTS (`ON DELETE SET NULL`) | Students can optionally scope a doubt to a specific module for finer context. |
| **Answers Doubt** | `DOUBTS` $\leftrightarrow$ `DOUBT_RESPONSES` | $1 : N$ | Total on DOUBT_RESPONSES (`ON DELETE CASCADE`) | A doubt can have multiple responses (initial AI response + instructor follow-up). |
| **Cites Source (RAG)** | `DOUBT_RESPONSES` $\leftrightarrow$ `COURSE_CONTENT` | $M : N$ via `DOUBT_RESPONSE_SOURCES` | Total on DOUBT_RESPONSE_SOURCES | AI responses cite 0 to many content chunks. Content chunks can be cited across multiple responses. |

---

## 5. Relational Schema Specification (Data Dictionary)

### 1. `users`
*Represents system actors (students, instructors, administrators).*

| Attribute | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique identifier for user |
| `name` | `VARCHAR(100)` | NOT NULL | User's full display name |
| `email` | `VARCHAR(150)` | UNIQUE, NOT NULL | Unique login email address |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Secure salted password hash (e.g., bcrypt/argon2) |
| `role` | `user_role (ENUM)` | NOT NULL, DEFAULT `'student'` | Enum values: `'student'`, `'instructor'`, `'admin'` |
| `created_at` | `TIMESTAMP` | DEFAULT `NOW()` | Registration audit timestamp |

---

### 2. `courses`
*Represents academic courses created and managed by instructors.*

| Attribute | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique course ID |
| `title` | `VARCHAR(150)` | NOT NULL | Course title |
| `description` | `TEXT` | NULLABLE | Detailed course syllabus / overview |
| `instructor_id` | `INTEGER` | **FOREIGN KEY** $\to$ `users(id)` | Instructor assigned; `ON DELETE SET NULL` |
| `created_at` | `TIMESTAMP` | DEFAULT `NOW()` | Creation audit timestamp |

---

### 3. `enrollments`
*Associative entity mapping students to their enrolled courses.*

| Attribute | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique enrollment record ID |
| `student_id` | `INTEGER` | **FOREIGN KEY** $\to$ `users(id)` | Student; `ON DELETE CASCADE` |
| `course_id` | `INTEGER` | **FOREIGN KEY** $\to$ `courses(id)` | Course enrolled in; `ON DELETE CASCADE` |
| `enrolled_at` | `TIMESTAMP` | DEFAULT `NOW()` | Enrollment timestamp |
| *Composite Constraint* | — | `UNIQUE(student_id, course_id)` | Prevents duplicate student enrollments |

---

### 4. `modules`
*Sequential instructional units / chapters within a course.*

| Attribute | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique module ID |
| `course_id` | `INTEGER` | **FOREIGN KEY** $\to$ `courses(id)` | Parent course; `ON DELETE CASCADE` |
| `title` | `VARCHAR(150)` | NOT NULL | Module chapter name |
| `order_index` | `INTEGER` | DEFAULT `0` | Sequence order for UI sorting |
| `created_at` | `TIMESTAMP` | DEFAULT `NOW()` | Creation timestamp |

---

### 5. `course_content`
*Granular instructional items (text lessons, PDF links, lecture transcript text).*

| Attribute | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique content item ID |
| `module_id` | `INTEGER` | **FOREIGN KEY** $\to$ `modules(id)` | Parent module; `ON DELETE CASCADE` |
| `title` | `VARCHAR(150)` | NOT NULL | Content headline |
| `content_type` | `content_type (ENUM)` | NOT NULL | Enum: `'text'`, `'pdf'`, `'video'`, `'slide'`, `'link'` |
| `content_text` | `TEXT` | NULLABLE | Raw text used for indexing and LLM prompt context |
| `file_url` | `VARCHAR(255)` | NULLABLE | Remote URI / S3 storage pointer |
| `created_at` | `TIMESTAMP` | DEFAULT `NOW()` | Content upload timestamp |

---

### 6. `content_embeddings` (pgvector Extension)
*High-dimensional vector embeddings for Retrieval-Augmented Generation (RAG).*

| Attribute | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique embedding ID |
| `content_id` | `INTEGER` | **FOREIGN KEY** $\to$ `course_content(id)` | Source content item; `ON DELETE CASCADE` |
| `chunk_text` | `TEXT` | NOT NULL | Exact textual chunk represented by the vector |
| `embedding` | `VECTOR(1536)` | NOT NULL | 1536-dimensional vector for cosine similarity |
| `created_at` | `TIMESTAMP` | DEFAULT `NOW()` | Embedding generation timestamp |

> **Vector Indexing**: Indexed via `IVFFlat` (`embedding vector_cosine_ops`) with list clustering for $<10\text{ms}$ nearest-neighbor retrieval.

---

### 7. `doubts`
*Student-submitted academic queries.*

| Attribute | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique doubt ID |
| `student_id` | `INTEGER` | **FOREIGN KEY** $\to$ `users(id)` | Student who asked; `ON DELETE CASCADE` |
| `course_id` | `INTEGER` | **FOREIGN KEY** $\to$ `courses(id)` | Related course; `ON DELETE SET NULL` |
| `module_id` | `INTEGER` | **FOREIGN KEY** $\to$ `modules(id)` | Related module (optional); `ON DELETE SET NULL` |
| `question_text` | `TEXT` | NOT NULL | Verbatim student question |
| `status` | `doubt_status (ENUM)` | DEFAULT `'pending'` | Enum: `'pending'`, `'answered'`, `'escalated'` |
| `created_at` | `TIMESTAMP` | DEFAULT `NOW()` | Submission timestamp |

---

### 8. `doubt_responses`
*AI-synthesized or instructor-authored answers.*

| Attribute | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique response ID |
| `doubt_id` | `INTEGER` | **FOREIGN KEY** $\to$ `doubts(id)` | Target doubt; `ON DELETE CASCADE` |
| `answer_text` | `TEXT` | NOT NULL | Comprehensive explanatory response |
| `confidence_score` | `FLOAT` | CHECK ($0.0 \le x \le 1.0$) | AI model confidence; NULL for instructor answers |
| `generated_at` | `TIMESTAMP` | DEFAULT `NOW()` | Generation timestamp |

---

### 9. `doubt_response_sources`
*Traceable citation links connecting AI answers to course syllabus chunks.*

| Attribute | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique citation link ID |
| `doubt_response_id` | `INTEGER` | **FOREIGN KEY** $\to$ `doubt_responses(id)` | The response providing the citation |
| `content_id` | `INTEGER` | **FOREIGN KEY** $\to$ `course_content(id)` | The content item cited as factual evidence |

---

### 10. `course_assets` (MongoDB Collection)
*Stores flexible and polymorphic metadata for binary educational assets.*

| Attribute | BSON Type | Constraints | Description |
|---|---|---|---|
| `_id` | `ObjectId` | **PRIMARY KEY** | MongoDB auto-generated document ID |
| `courseId` | `Number (Int)` | INDEXED, NOT NULL | Logical Foreign Key to PostgreSQL `courses.id` |
| `moduleId` | `Number (Int)` | INDEXED, NOT NULL | Logical Foreign Key to PostgreSQL `modules.id` |
| `type` | `String` | Enum: `video`, `pdf`, `slide`, `note` | Media categorization |
| `title` | `String` | NOT NULL | Display filename or title |
| `url` | `String` | NOT NULL | Public CDN or storage URL |
| `tags` | `Array of Strings` | Default `[]` | Search tags: e.g. `["normalization", "bcnf"]` |
| `uploadedBy` | `Number (Int)` | NOT NULL | Logical Foreign Key to PostgreSQL `users.id` |
| `metadata` | `Object (Mixed)` | Flexible schema | Polymorphic fields: <br>• Video: `{ durationSeconds: 1830, resolution: "1080p" }`<br>• PDF: `{ pageCount: 24, fileSizeMb: 3.2 }` |
| `createdAt` | `Date` | Timestamp | Asset upload timestamp |
| `updatedAt` | `Date` | Timestamp | Asset modification timestamp |

---

### 11. `doubt_attachments` (MongoDB Collection)
*Binary attachments uploaded by students to illustrate their doubts.*

| Attribute | BSON Type | Constraints | Description |
|---|---|---|---|
| `_id` | `ObjectId` | **PRIMARY KEY** | MongoDB auto-generated document ID |
| `doubtId` | `Number (Int)` | INDEXED, NOT NULL | Logical Foreign Key to PostgreSQL `doubts.id` |
| `fileUrl` | `String` | NOT NULL | S3 / Storage URL of screenshot/photo |
| `fileType` | `String` | NOT NULL | MIME type: `image/png`, `application/pdf` |
| `uploadedAt` | `Date` | Timestamp | Upload timestamp |

---

## 6. Normalization Analysis (Relational Soundness)

All relational tables in PostgreSQL are normalized up to **Third Normal Form (3NF)** / **Boyce-Codd Normal Form (BCNF)**:

1. **First Normal Form (1NF)**:
   - All attribute values are atomic (e.g. no comma-separated lists of tags or courses).
   - Each table has a designated primary key (`id`).
2. **Second Normal Form (2NF)**:
   - In tables with composite candidate keys like `enrollments (student_id, course_id)`, non-key attributes (`enrolled_at`) depend on the full candidate key, eliminating partial functional dependencies.
3. **Third Normal Form (3NF)**:
   - No transitive dependencies ($X \to Y \to Z$ where $Y$ is not a superkey).
   - Example: In `doubts`, instructor details are not stored directly; only `student_id` and `course_id` are stored. Instructor information is accessed by joining `courses` and `users`.
4. **Boyce-Codd Normal Form (BCNF)**:
   - In every functional dependency $X \to Y$, the determinant $X$ is a superkey.

---

## 7. RAG Workflow Mapped to the ER Model

```
       [ Student ]
            │ (asks question)
            ▼
        [ DOUBTS ]
            │
            ├──────────────────────────────────────────────────┐
            ▼                                                  ▼
[ 1. Generate Query Vector ]                           [ 2. Filter Scope ]
(e.g., text-embedding-ada-002)                         (WHERE course_id = ?)
            │                                                  │
            └─────────────────────────┬────────────────────────┘
                                      ▼
                        [ CONTENT_EMBEDDINGS ]
                  (Cosine Distance: embedding <=> query)
                                      │ (Top-K matches)
                                      ▼
                             [ COURSE_CONTENT ]
                         (Fetch raw chunk text)
                                      │
                                      ▼
                          [ LLM Inference Engine ]
                        (Synthesizes answer text)
                                      │
                                      ▼
                           [ DOUBT_RESPONSES ]
                        (Store answer + score)
                                      │
                                      ▼
                        [ DOUBT_RESPONSE_SOURCES ]
                    (Insert M:N citation links)
```
