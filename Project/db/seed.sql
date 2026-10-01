-- ============================================================
-- Learning Platform — PostgreSQL Seed Data
-- db/seed.sql  (run AFTER schema.sql)
-- ============================================================

-- ============================================================
-- USERS (1 instructor + 3 students)
-- Passwords are bcrypt hashes of "password123" (cost=10)
-- ============================================================

INSERT INTO users (name, email, password_hash, role) VALUES
  ('Dr. Ananya Sharma',  'ananya@platform.edu',  '$2b$10$K8Ghe6e9pLV5N3RYZ4zQ5OGjF1F1TxTvJ6M8LsNqkXW2yHzPq0e5m', 'instructor'),
  ('Ravi Kumar',         'ravi@student.edu',     '$2b$10$K8Ghe6e9pLV5N3RYZ4zQ5OGjF1F1TxTvJ6M8LsNqkXW2yHzPq0e5m', 'student'),
  ('Priya Mehta',        'priya@student.edu',    '$2b$10$K8Ghe6e9pLV5N3RYZ4zQ5OGjF1F1TxTvJ6M8LsNqkXW2yHzPq0e5m', 'student'),
  ('Arjun Nair',         'arjun@student.edu',    '$2b$10$K8Ghe6e9pLV5N3RYZ4zQ5OGjF1F1TxTvJ6M8LsNqkXW2yHzPq0e5m', 'student');

-- ============================================================
-- COURSES
-- ============================================================

INSERT INTO courses (title, description, instructor_id) VALUES
  (
    'Database Systems & Design',
    'A comprehensive course covering relational databases, normalization, SQL, transactions, and modern distributed data stores including NoSQL and vector databases.',
    1
  ),
  (
    'Distributed Systems Engineering',
    'Fundamentals of distributed computing: CAP theorem, consensus protocols, microservices, message queues, and real-world fault-tolerant architectures.',
    1
  );

-- ============================================================
-- ENROLLMENTS
-- ============================================================

-- All 3 students enrolled in both courses
INSERT INTO enrollments (student_id, course_id) VALUES
  (2, 1), (2, 2),
  (3, 1), (3, 2),
  (4, 1);

-- ============================================================
-- MODULES — Course 1: Database Systems
-- ============================================================

INSERT INTO modules (course_id, title, order_index) VALUES
  (1, 'Introduction to Relational Databases',  0),
  (1, 'Normalization & Schema Design',          1),
  (1, 'Indexing & Query Optimization',          2),
  (1, 'Transactions & Concurrency Control',     3),
  (1, 'NoSQL & Vector Databases',               4);

-- ============================================================
-- MODULES — Course 2: Distributed Systems
-- ============================================================

INSERT INTO modules (course_id, title, order_index) VALUES
  (2, 'Fundamentals of Distributed Systems',   0),
  (2, 'CAP Theorem & Consistency Models',       1),
  (2, 'Microservices Architecture',             2),
  (2, 'Message Queues & Event Streaming',       3);

-- ============================================================
-- COURSE CONTENT — Module 1 (Intro to RDBMS)
-- ============================================================

INSERT INTO course_content (module_id, title, content_type, content_text, file_url) VALUES
  (1, 'What is a Relational Database?', 'text',
   'A relational database organizes data into tables (relations) with rows and columns. Each table represents an entity type, and relationships between tables are expressed using foreign keys. The relational model was proposed by Edgar F. Codd in 1970 and remains the foundation of most enterprise data management systems.',
   NULL),
  (1, 'Lecture 1 — ER Diagrams & Data Modeling', 'slide',
   NULL, 'https://assets.platform.edu/db-sys/module1/lecture1-slides.pdf'),
  (1, 'Intro to SQL — Video Walkthrough', 'video',
   NULL, 'https://assets.platform.edu/db-sys/module1/intro-sql.mp4');

-- Module 2 (Normalization)
INSERT INTO course_content (module_id, title, content_type, content_text, file_url) VALUES
  (2, 'First, Second, and Third Normal Forms', 'text',
   '1NF requires atomic column values. 2NF requires that all non-key attributes depend on the entire primary key (no partial dependencies). 3NF requires no transitive dependencies — every non-key attribute must depend only on the primary key, not on another non-key attribute.',
   NULL),
  (2, 'Normalization Worksheet', 'pdf',
   NULL, 'https://assets.platform.edu/db-sys/module2/normalization-worksheet.pdf'),
  (2, 'BCNF & Decomposition', 'text',
   'Boyce-Codd Normal Form (BCNF) is a stronger form of 3NF. A relation is in BCNF if for every non-trivial functional dependency X → Y, X is a superkey. Decomposition into BCNF is always dependency-preserving when applied correctly.',
   NULL);

-- Module 3 (Indexing)
INSERT INTO course_content (module_id, title, content_type, content_text, file_url) VALUES
  (3, 'B-Tree and Hash Indexes Explained', 'text',
   'B-Tree indexes maintain a sorted structure allowing O(log n) point lookups and range queries. Hash indexes provide O(1) point lookups but cannot support range queries. PostgreSQL defaults to B-Tree for most index types.',
   NULL),
  (3, 'Query Optimization & EXPLAIN ANALYZE', 'video',
   NULL, 'https://assets.platform.edu/db-sys/module3/explain-analyze.mp4');

-- Module 5 (NoSQL & Vector)
INSERT INTO course_content (module_id, title, content_type, content_text, file_url) VALUES
  (5, 'When to Choose NoSQL over SQL', 'text',
   'NoSQL databases sacrifice ACID guarantees (or provide them in limited forms) in exchange for horizontal scalability, schema flexibility, and performance at very high write volumes. Document stores like MongoDB excel for heterogeneous, deeply nested data. Key-value stores suit session caches. Column-family stores handle wide, sparse tables.',
   NULL),
  (5, 'pgvector: Semantic Search in PostgreSQL', 'text',
   'pgvector is a PostgreSQL extension that adds a VECTOR data type and similarity operators (cosine, L2, inner product). It enables storing dense embeddings alongside relational data, allowing semantic search without a separate vector database. The ivfflat index dramatically reduces query time for large corpora.',
   NULL);

-- ============================================================
-- DOUBTS
-- ============================================================

INSERT INTO doubts (student_id, course_id, module_id, question_text, status) VALUES
  (2, 1, 2, 'What is the difference between 2NF and BCNF? My notes say BCNF is stricter but I don''t understand why a relation in 3NF might not be in BCNF.', 'answered'),
  (2, 1, 3, 'When should I use a Hash index over a B-Tree index in PostgreSQL?', 'answered'),
  (3, 1, 5, 'How does pgvector decide which chunks are most relevant to a query? Is cosine similarity always better than L2 distance?', 'pending'),
  (4, 1, 1, 'Can a table have multiple foreign keys pointing to the same parent table? What happens if the parent row is deleted?', 'answered'),
  (2, 2, 6, 'I understand CAP theorem says you can only pick 2 of 3, but in practice most systems seem to always be partition-tolerant. Does that mean we''re really just choosing between CP and AP?', 'escalated');

-- ============================================================
-- DOUBT RESPONSES
-- ============================================================

INSERT INTO doubt_responses (doubt_id, answer_text, confidence_score) VALUES
  (1,
   'Great question! The key difference lies in what counts as a "determinant." In 3NF, non-key attributes must not transitively depend on the primary key — but the left-hand side of a functional dependency can be a non-superkey as long as the right-hand side is a prime attribute (part of some candidate key). BCNF is stricter: every determinant in a non-trivial FD must be a superkey. This means a relation can violate BCNF even if it satisfies 3NF whenever a non-superkey attribute determines a prime attribute. Example: TEACH(student, course, instructor) with FDs {student,course→instructor} and {instructor→course} — this is in 3NF but not BCNF because "instructor" determines "course" yet instructor is not a superkey.',
   0.94),
  (2,
   'In PostgreSQL, Hash indexes are best for equality comparisons only (=). B-Tree indexes are more general — they support equality, range queries (<, >, BETWEEN), ORDER BY, and LIKE prefix patterns. Hash indexes are slightly faster for pure equality lookups, but PostgreSQL''s B-Tree implementation is highly optimized and the difference is usually negligible. Prefer Hash only when you are 100% certain you will never need a range query on that column and the table is very large.',
   0.89),
  (4,
   'Yes, a table can have multiple foreign keys referencing the same parent table (even on different columns). ON DELETE behavior is configurable per FK: CASCADE deletes child rows automatically, SET NULL sets the FK column to NULL, RESTRICT (the default) prevents deletion if any child row exists, and NO ACTION is similar to RESTRICT but deferred. Choose CASCADE when child rows have no meaning without the parent, and SET NULL when the relationship is optional.',
   0.91),
  (5,
   'You have nailed the practical insight! In distributed systems that must operate across networks (which almost always can partition), P is non-negotiable. So the real trade-off is CP vs AP. CP systems (e.g., HBase, Zookeeper) return an error during a partition rather than serving stale data — prioritizing consistency. AP systems (e.g., Cassandra, CouchDB) serve the best available data during partitions, accepting eventual consistency. Modern systems like Google Spanner blur this line using globally synchronized clocks (TrueTime) to provide near-C guarantees while remaining highly available.',
   0.87);

-- ============================================================
-- DOUBT RESPONSE SOURCES
-- ============================================================

INSERT INTO doubt_response_sources (doubt_response_id, content_id) VALUES
  (1, 5), -- BCNF answer sourced from "First, Second, and Third Normal Forms"
  (1, 6), -- and "BCNF & Decomposition"
  (2, 7), -- Hash vs B-Tree sourced from "B-Tree and Hash Indexes"
  (4, 3); -- FK answer sourced from "What is a Relational Database?"
