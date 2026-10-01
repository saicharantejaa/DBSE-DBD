# LearnAI Platform — Phase 2 Backend (FastAPI)

> **CO1** · CO2 · CO3 evidence — replaces `mock-api/` with a real layered FastAPI
> application backed by PostgreSQL (SQLAlchemy + pgvector) and MongoDB (Motor).

---

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Python | ≥ 3.11 |
| PostgreSQL | ≥ 15 with `pgvector` extension |
| MongoDB | ≥ 6.0 |

### 1. Set up the environment

```bash
# From the project root:
cd "DBSE project/backend"

# Create and activate virtualenv
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, MONGO_URL, JWT_SECRET
```

Example `.env`:
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/learnai
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=learnai
JWT_SECRET=super-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 3. Apply the database schema and seed data

```bash
# From the project root (not backend/):
psql -U postgres -d learnai -f db/schema.sql
psql -U postgres -d learnai -f db/seed.sql
```

`schema.sql` now includes (Phase 2 additions — see bottom of the file):
- **Trigger** `trg_mark_doubt_answered` — fires after INSERT on `doubt_responses`
- **Stored procedure** `enroll_student(p_student_id, p_course_id)` — idempotent enrollment
- **View** `course_doubt_analytics` — doubt counts per course for instructor dashboard

Verify in psql:
```sql
\df mark_doubt_answered    -- trigger function
\d+ doubts                 -- see the trigger attached
\dv course_doubt_analytics -- view
CALL enroll_student(2, 1); -- test the procedure (idempotent)
```

### 4. Seed vector embeddings

```bash
# From the backend/ directory, with .env configured:
python seed_embeddings.py
```

This embeds every `course_content` row into `content_embeddings` using the
deterministic mock embedding function. Required for the pgvector RAG search to
return real sources when students submit doubts.

### 5. Start the API

```bash
# From the backend/ directory:
uvicorn app.main:app --reload --port 8000
```

API is at **http://localhost:8000**  
Swagger UI at **http://localhost:8000/docs**  
ReDoc at **http://localhost:8000/redoc**

### 6. Run the frontend

```bash
cd "DBSE project/frontend"
npm run dev
```

The frontend now points to `http://localhost:8000` (updated in `src/api/client.js`).

---

## Running Tests

```bash
# From the backend/ directory:
# Ensure DATABASE_URL in .env points to a Postgres DB with schema.sql applied
pytest
```

Tests use **transaction rollback** per test — no data leaks between tests.  
The test suite connects to the same Postgres DB (not SQLite) so pgvector works.

### Coverage

Run `pytest` and look for the coverage summary in the terminal output, or open
`htmlcov/index.html` in a browser after the run.

**Approximate coverage target: ≥ 70%** (core business logic in `services/` and `repositories/`).

---

## Architecture

```
backend/
  app/
    main.py                 ← FastAPI app, CORS, router registration, lifespan
    core/
      config.py             ← Pydantic settings (reads .env)
      security.py           ← bcrypt hashing + JWT create/verify
    db/
      postgres.py           ← SQLAlchemy async engine + get_db() dependency
      mongo.py              ← Motor client + collection accessors
    models/                 ← SQLAlchemy ORM models (one file per table)
    schemas/                ← Pydantic request/response schemas
    repositories/           ← Raw DB queries (no business logic)
    services/
      auth_service.py       ← register / login logic
      course_service.py     ← course/module/content assembly, enrollment, analytics
      doubt_service.py      ← full RAG pipeline orchestration
      rag.py                ← embed_text() + generate_answer() (swappable)
    routers/                ← one router per resource group
    dependencies.py         ← get_current_user, require_role() RBAC factory
```

### Data flow: POST /doubts (RAG pipeline)

```
Client → POST /doubts
  → doubt_service.submit_doubt()
      1. INSERT into doubts                     (repo)
      2. embed_text(question)                   (rag.py — mock or real model)
      3. pgvector similarity search <=>         (embedding_repo — CO2 evidence)
      4. generate_answer(question, chunks)      (rag.py — template or LLM)
      5. INSERT into doubt_responses            (repo — FIRES TRIGGER → status='answered')
      6. INSERT into doubt_response_sources     (repo)
      7. COMMIT (single transaction)
      8. Return DoubtDetail with response+sources
```

---

## CO Evidence Reference

### CO1 — Relational DB Engineering

| Object | Location | SQL Evidence |
|--------|----------|-------------|
| Trigger | `db/schema.sql` line ~125 | `trg_mark_doubt_answered` — AFTER INSERT on `doubt_responses` updates `doubts.status` |
| Stored Procedure | `db/schema.sql` line ~140 | `enroll_student(p_student_id, p_course_id)` — idempotent via `IF NOT EXISTS` |
| View | `db/schema.sql` line ~155 | `course_doubt_analytics` — COUNT with FILTER, LEFT JOIN, GROUP BY |
| Transaction | `app/services/doubt_service.py` | All 6 inserts in one `await db.commit()` |
| Procedure call | `app/repositories/enrollment_repo.py` | `CALL enroll_student(:sid, :cid)` |
| View query | `app/repositories/course_repo.py` | `SELECT * FROM course_doubt_analytics` |

### CO2 — SQL+NoSQL / Vector DB

| Feature | Location |
|---------|----------|
| pgvector similarity query | `app/repositories/embedding_repo.py` — `ORDER BY embedding <=> CAST(:vec AS vector)` |
| Embedding pipeline | `app/services/rag.py` — `embed_text()` deterministic mock, swap-ready |
| MongoDB client | `app/db/mongo.py` — Motor async client for `course_assets` + `doubt_attachments` |
| Embedding seeder | `backend/seed_embeddings.py` |

### CO3 — FastAPI Backend Engineering

| Feature | Location |
|---------|----------|
| Layered architecture | routers → services → repositories |
| JWT creation/verification | `app/core/security.py` |
| RBAC | `app/dependencies.py` — `require_role("instructor")` |
| Pydantic schemas | `app/schemas/` |
| Async SQLAlchemy | `app/db/postgres.py` + all repo files |
| Swagger UI | `/docs` (enabled by default, not disabled) |
| Tests | `tests/test_auth.py`, `test_doubts.py`, `test_courses.py` |

---

## Swapping in a Real Embedding Model

Open `app/services/rag.py` and replace the body of `embed_text()`:

```python
# Option A — sentence-transformers (no API key, local)
from sentence_transformers import SentenceTransformer
_model = SentenceTransformer("all-MiniLM-L6-v2")  # 384 dims
def embed_text(text: str) -> List[float]:
    return _model.encode(text, normalize_embeddings=True).tolist()
# Also change VECTOR(1536) → VECTOR(384) in schema.sql + ContentEmbedding model

# Option B — OpenAI ada-002 (1536 dims, drop-in replacement)
import openai
def embed_text(text: str) -> List[float]:
    r = openai.embeddings.create(input=text, model="text-embedding-ada-002")
    return r.data[0].embedding
```

Re-run `python seed_embeddings.py` after changing the model.

---

## Assumptions & Design Decisions

1. **Auth is optional on most routes** — The frontend pages still work without a JWT  
   (only `/courses/{id}/analytics` requires instructor role). This matches the Phase 1 
   demo UX where quick login bypasses a real form.

2. **Mock embedding function** — `embed_text()` uses SHA-256 → numpy RNG.  
   This means vectors are deterministic and searchable but not semantically meaningful.  
   The cosine distances will not cluster by topic. Switch to a real model for meaningful RAG.

3. **No Alembic** — Schema is managed via `db/schema.sql` directly (as per Phase 1 convention).  
   `schema.sql` uses `CREATE OR REPLACE` and `IF NOT EXISTS` throughout.

4. **MongoDB** — Motor client is initialized lazily. The `course_assets` and  
   `doubt_attachments` collections are wired but no routes currently expose them directly  
   (the doubt submission stores everything in Postgres; Mongo is ready for file attachments).

5. **Frontend backward compatibility** — All response field names match the mock API's  
   camelCase shapes. `DoubtSolverPage.jsx` reads `result.response.answerText` etc. —  
   unchanged.

6. **Test isolation** — Tests use transaction rollback, so running them against the  
   main `learnai` DB is safe (no permanent writes). Set `TEST_DATABASE_URL` to use  
   a dedicated test database instead.

7. **mock-api/ left intact** — The Express mock API still works on port 3001 as a  
   fallback if you need to demo without a live database.
