# Learning Platform with AI Doubt Solver — Phase 1

A fully demoable React frontend + Express mock API for a distributed, AI-powered educational platform. Built for a **Database Systems + Distributed Backend** college project.

---

## Quick Start

### 1. Start the Mock API

```bash
cd mock-api
node index.js
# Runs on http://localhost:3001
```

### 2. Start the Frontend

```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.  
Use **Quick Demo Access** buttons on the login page to sign in instantly.

---

## Project Structure

```
├── frontend/           React (Vite) app — all 6 screens
├── mock-api/           Express mock server — realistic canned responses
├── db/
│   ├── schema.sql      PostgreSQL DDL (with pgvector)
│   ├── seed.sql        PostgreSQL seed data (4 users, 2 courses, 5 doubts)
│   ├── mongo-schemas.js  Mongoose collection schemas
│   └── seed-mongo.js   MongoDB seed script
└── README.md
```

---

## Running the Database (Optional — not required for demo)

### PostgreSQL

```bash
# Make sure pgvector extension is available in your PostgreSQL installation
psql -U postgres -d your_db -f db/schema.sql
psql -U postgres -d your_db -f db/seed.sql
```

### MongoDB

```bash
cd db
npm install mongoose   # if not already installed
MONGODB_URI=mongodb://localhost:27017/learning_platform node seed-mongo.js
```

---

## Frontend Screens

| Route | Screen |
|---|---|
| `/` | Login / Signup with role selector |
| `/dashboard` | Student Dashboard — courses, doubts, stats |
| `/catalog` | Course Catalog — search & browse |
| `/courses/:id` | Course Detail — accordion module list with content |
| `/doubt-solver` | AI Doubt Solver — chat interface with source cards |
| `/my-doubts` | My Doubts — history with status filter |
| `/instructor` | Instructor Doubt Inbox (instructor role only) |

---

## Mock API Endpoints

All run on `http://localhost:3001`:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/courses` | List all courses |
| GET | `/courses/:id` | Course with modules and content |
| GET | `/enrollments?studentId=` | Student's enrolled courses |
| GET | `/doubts?studentId=` | Student's doubt history |
| GET | `/doubts?instructorId=` | Instructor's doubt inbox |
| POST | `/doubts` | Submit doubt → canned AI response after 1.5s delay |
| GET | `/users/:id` | User profile |

---

## Database Design Rationale

### Why PostgreSQL?
Structured, relational data with strict integrity constraints — users, courses, enrollments, and doubts all have well-defined schemas and foreign key relationships. ACID guarantees are important for tracking academic records.

### Why MongoDB?
Course assets (videos, PDFs, slides) have highly variable metadata — a video has duration/resolution/codec, a PDF has page count, a slide deck has slide count. MongoDB's flexible document model handles this heterogeneity without schema migrations.

### Why pgvector?
Instead of deploying a separate vector database (Pinecone, Weaviate), we store embeddings alongside the relational data in PostgreSQL using the `pgvector` extension. The `content_embeddings` table stores 1536-dimension embeddings (OpenAI `text-embedding-ada-002`) for each `course_content` chunk. At query time, cosine similarity retrieves the top-k most relevant content chunks for a given student doubt — this is the RAG (Retrieval-Augmented Generation) pipeline.

---

## Complete ER Design & Documentation

- 🏆 [**Expanded ER Diagram (Exact Reference Style - Print to PDF)**](er-diagram.html) — Authentic Crow's foot ER diagram matching your reference with table cards, keys, and orthogonal lines.
- 🎨 [**Visual Basic ER Flowchart**](basic-er-flowchart.html) — Flowchart cards with purpose summaries and step-by-step breakdown.
- 📐 [**Full Database ER Design Specification**](db/DATABASE_ER_DESIGN.md) — Comprehensive technical ER document with data dictionary and 3NF/BCNF normalization proofs.
- 🌐 [**Interactive Design Viewer**](database-design.html) — Complete multi-zone interactive design viewer.

---

## Demo Checklist

- [ ] `cd frontend && npm run dev` — loads on port 5173 with no console errors
- [ ] `cd mock-api && node index.js` — starts on port 3001
- [ ] All 6 screens reachable
- [ ] Doubt Solver: select course → type question → 1.5s delay → AI answer + source cards appear
- [ ] My Doubts: filter by status (answered / pending / escalated)
- [ ] Instructor login: Doubt Inbox shows all student questions
- [ ] `psql -f db/schema.sql` runs cleanly on a fresh PostgreSQL DB
- [ ] `node -e "require('./db/mongo-schemas.js')"` — no errors
