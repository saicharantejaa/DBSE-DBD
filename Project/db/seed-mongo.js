// ============================================================
// Learning Platform — MongoDB Seed Script
// db/seed-mongo.js
//
// Run with: node db/seed-mongo.js
// Requires MONGODB_URI env var or defaults to localhost
// ============================================================

const mongoose = require('mongoose');
const { CourseAsset, DoubtAttachment } = require('./mongo-schemas');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/learning_platform';

const courseAssets = [
  // ── Course 1, Module 1 ──────────────────────────────────────
  {
    courseId: 1,
    moduleId: 1,
    type: 'slide',
    title: 'Lecture 1 — ER Diagrams & Data Modeling',
    url: 'https://assets.platform.edu/db-sys/module1/lecture1-slides.pdf',
    tags: ['ER diagrams', 'data modeling', 'entities', 'relationships'],
    uploadedBy: 1,
    metadata: { slideCount: 38, software: 'Google Slides', lastEdited: '2025-08-10' },
  },
  {
    courseId: 1,
    moduleId: 1,
    type: 'video',
    title: 'Intro to SQL — Video Walkthrough',
    url: 'https://assets.platform.edu/db-sys/module1/intro-sql.mp4',
    tags: ['SQL', 'SELECT', 'CREATE TABLE', 'beginner'],
    uploadedBy: 1,
    metadata: { durationSeconds: 2340, resolution: '1080p', codec: 'h264', fileSizeMb: 312 },
  },

  // ── Course 1, Module 2 (Normalization) ──────────────────────
  {
    courseId: 1,
    moduleId: 2,
    type: 'pdf',
    title: 'Normalization Worksheet — Practice Problems',
    url: 'https://assets.platform.edu/db-sys/module2/normalization-worksheet.pdf',
    tags: ['normalization', '1NF', '2NF', '3NF', 'BCNF', 'exercises'],
    uploadedBy: 1,
    metadata: { pageCount: 12, fileSizeMb: 0.8 },
  },

  // ── Course 1, Module 3 (Indexing) ───────────────────────────
  {
    courseId: 1,
    moduleId: 3,
    type: 'video',
    title: 'EXPLAIN ANALYZE — Reading PostgreSQL Query Plans',
    url: 'https://assets.platform.edu/db-sys/module3/explain-analyze.mp4',
    tags: ['PostgreSQL', 'EXPLAIN ANALYZE', 'query plan', 'performance'],
    uploadedBy: 1,
    metadata: { durationSeconds: 1830, resolution: '1080p', codec: 'h264', fileSizeMb: 241 },
  },

  // ── Course 1, Module 5 (NoSQL & Vector) ─────────────────────
  {
    courseId: 1,
    moduleId: 5,
    type: 'slide',
    title: 'pgvector Deep Dive — Semantic Search in PostgreSQL',
    url: 'https://assets.platform.edu/db-sys/module5/pgvector-slides.pdf',
    tags: ['pgvector', 'embeddings', 'semantic search', 'vector database', 'PostgreSQL'],
    uploadedBy: 1,
    metadata: { slideCount: 24, software: 'Figma Slides' },
  },
  {
    courseId: 1,
    moduleId: 5,
    type: 'pdf',
    title: 'NoSQL vs SQL — Decision Framework',
    url: 'https://assets.platform.edu/db-sys/module5/nosql-decision-guide.pdf',
    tags: ['NoSQL', 'MongoDB', 'Cassandra', 'comparison', 'when to use'],
    uploadedBy: 1,
    metadata: { pageCount: 6, fileSizeMb: 0.5 },
  },

  // ── Course 2, Module 6 (Distributed Fundamentals) ───────────
  {
    courseId: 2,
    moduleId: 6,
    type: 'slide',
    title: 'Week 1 — What Makes a System Distributed?',
    url: 'https://assets.platform.edu/dist-sys/module6/week1-slides.pdf',
    tags: ['distributed systems', 'latency', 'fault tolerance', 'fundamentals'],
    uploadedBy: 1,
    metadata: { slideCount: 45, software: 'PowerPoint' },
  },

  // ── Course 2, Module 7 (CAP Theorem) ────────────────────────
  {
    courseId: 2,
    moduleId: 7,
    type: 'pdf',
    title: "Brewer's CAP Theorem — Original Paper Summary",
    url: 'https://assets.platform.edu/dist-sys/module7/cap-summary.pdf',
    tags: ['CAP theorem', 'consistency', 'availability', 'partition tolerance'],
    uploadedBy: 1,
    metadata: { pageCount: 8, fileSizeMb: 1.1 },
  },
  {
    courseId: 2,
    moduleId: 7,
    type: 'video',
    title: 'CP vs AP Systems — Cassandra & Zookeeper Compared',
    url: 'https://assets.platform.edu/dist-sys/module7/cp-ap-demo.mp4',
    tags: ['Cassandra', 'Zookeeper', 'AP', 'CP', 'CAP', 'demo'],
    uploadedBy: 1,
    metadata: { durationSeconds: 2760, resolution: '1080p', codec: 'h264', fileSizeMb: 365 },
  },
];

const doubtAttachments = [
  {
    doubtId: 3,
    fileUrl: 'https://assets.platform.edu/attachments/doubt3-screenshot.png',
    fileType: 'image/png',
  },
  {
    doubtId: 5,
    fileUrl: 'https://assets.platform.edu/attachments/doubt5-diagram.jpg',
    fileType: 'image/jpeg',
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);

    // Clear existing data
    await CourseAsset.deleteMany({});
    await DoubtAttachment.deleteMany({});
    console.log('Cleared existing collections.');

    // Insert seed data
    const assets = await CourseAsset.insertMany(courseAssets);
    console.log(`Inserted ${assets.length} course_assets.`);

    const attachments = await DoubtAttachment.insertMany(doubtAttachments);
    console.log(`Inserted ${attachments.length} doubt_attachments.`);

    console.log('\n✅ MongoDB seed complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
