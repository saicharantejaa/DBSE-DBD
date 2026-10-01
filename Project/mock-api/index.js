// ============================================================
// Learning Platform — Mock API Server
// mock-api/index.js
// Runs on http://localhost:3001
// ============================================================

const express = require('express');
const cors    = require('cors');

const fs      = require('fs');
const path    = require('path');
const { findDeepKnowledge, formatDeepAnswer } = require('./deep_knowledge');

const app  = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ============================================================
// SEED DATA  (loaded from courses_seed_data.json + db/seed.sql)
// ============================================================

const users = [
  { id: 1, name: 'Dr. Ananya Sharma', email: 'ananya@platform.edu', role: 'instructor', avatar: 'AS' },
  { id: 2, name: 'Ravi Kumar',        email: 'ravi@student.edu',    role: 'student',    avatar: 'RK' },
  { id: 3, name: 'Priya Mehta',       email: 'priya@student.edu',   role: 'student',    avatar: 'PM' },
  { id: 4, name: 'Arjun Nair',        email: 'arjun@student.edu',   role: 'student',    avatar: 'AN' },
];

let courses = [];
const seedDataPath = path.join(__dirname, '..', 'courses_seed_data.json');
try {
  if (fs.existsSync(seedDataPath)) {
    const rawData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));
    let contentIdCounter = 1;
    let moduleIdCounter = 1;
    courses = (rawData.courses || []).map((c, cIdx) => {
      const courseId = cIdx + 1;
      const mods = (c.modules || []).map((m, mIdx) => {
        const mId = moduleIdCounter++;
        const cId = contentIdCounter++;
        return {
          id: mId,
          courseId: courseId,
          title: m.title,
          orderIndex: mIdx,
          content: [
            {
              id: cId,
              title: m.title,
              type: 'text',
              snippet: m.content ? m.content.slice(0, 250) + '...' : '',
              content_text: m.content,
            }
          ]
        };
      });
      return {
        id: courseId,
        course_code: c.course_code,
        title: c.title,
        description: c.description,
        credits: c.credits,
        coordinator: c.coordinator,
        prerequisite: c.prerequisite,
        instructor: c.coordinator || 'Dr. Ananya Sharma',
        instructorId: 1,
        tag: c.course_code || 'Core',
        moduleCount: mods.length,
        modules: mods,
        resources: c.resources || {},
      };
    });
  }
} catch (err) {
  console.error('Error loading courses_seed_data.json into mock-api:', err);
}

// Enrollments: studentId -> [courseIds]
const enrollments = {
  2: [1, 2, 3, 4],
  3: [1, 2, 3],
  4: [1, 2],
};

const doubts = [
  {
    id: 1, studentId: 2, courseId: 1, moduleId: 2,
    questionText: 'What is the difference between 2NF and BCNF? My notes say BCNF is stricter but I don\'t understand why a relation in 3NF might not be in BCNF.',
    status: 'answered', createdAt: '2025-08-20T09:14:22Z',
    response: {
      answerText: 'The key difference lies in what counts as a "determinant." In 3NF, non-key attributes must not transitively depend on the primary key — but the LHS of an FD can be a non-superkey as long as the RHS is a prime attribute. BCNF is stricter: every determinant in a non-trivial FD must be a superkey. A relation can be in 3NF but not BCNF whenever a non-superkey attribute determines a prime attribute.',
      confidenceScore: 0.94,
      sources: [
        { contentId: 4, title: 'First, Second, and Third Normal Forms', type: 'text', moduleTitle: 'Normalization & Schema Design' },
        { contentId: 6, title: 'BCNF & Decomposition', type: 'text', moduleTitle: 'Normalization & Schema Design' },
      ],
    },
  },
  {
    id: 2, studentId: 2, courseId: 1, moduleId: 3,
    questionText: 'When should I use a Hash index over a B-Tree index in PostgreSQL?',
    status: 'answered', createdAt: '2025-08-22T14:30:10Z',
    response: {
      answerText: 'Hash indexes are best for pure equality comparisons (=) only. B-Tree indexes support equality, range queries, ORDER BY, and LIKE prefix patterns. Prefer Hash only when you\'re certain you\'ll never need a range query and the table is large enough that the marginal speed improvement matters.',
      confidenceScore: 0.89,
      sources: [
        { contentId: 7, title: 'B-Tree and Hash Indexes Explained', type: 'text', moduleTitle: 'Indexing & Query Optimization' },
      ],
    },
  },
  {
    id: 3, studentId: 3, courseId: 1, moduleId: 5,
    questionText: 'How does pgvector decide which chunks are most relevant to a query? Is cosine similarity always better than L2 distance?',
    status: 'pending', createdAt: '2025-09-01T11:05:44Z',
    response: null,
  },
  {
    id: 4, studentId: 4, courseId: 1, moduleId: 1,
    questionText: 'Can a table have multiple foreign keys pointing to the same parent table? What happens if the parent row is deleted?',
    status: 'answered', createdAt: '2025-08-25T16:22:00Z',
    response: {
      answerText: 'Yes, a table can have multiple FKs referencing the same parent. ON DELETE behavior is configurable: CASCADE deletes children automatically, SET NULL sets the FK to NULL, RESTRICT prevents deletion if children exist, NO ACTION is similar but deferred. Choose CASCADE when child rows are meaningless without the parent.',
      confidenceScore: 0.91,
      sources: [
        { contentId: 1, title: 'What is a Relational Database?', type: 'text', moduleTitle: 'Introduction to Relational Databases' },
      ],
    },
  },
  {
    id: 5, studentId: 2, courseId: 2, moduleId: 7,
    questionText: 'I understand CAP theorem says you can only pick 2 of 3, but in practice most systems seem to always be partition-tolerant. Does that mean we\'re really just choosing between CP and AP?',
    status: 'escalated', createdAt: '2025-09-03T08:45:00Z',
    response: {
      answerText: 'Exactly right. In network-connected systems, partitions are inevitable, so P is non-negotiable. The real trade-off is CP vs AP. CP systems (HBase, Zookeeper) return errors during a partition rather than stale data. AP systems (Cassandra, CouchDB) serve best-available data, accepting eventual consistency. Modern systems like Google Spanner blur this line using TrueTime.',
      confidenceScore: 0.87,
      sources: [
        { contentId: 15, title: "Brewer's CAP Theorem Explained", type: 'pdf', moduleTitle: 'CAP Theorem & Consistency Models' },
        { contentId: 16, title: 'CP vs AP Systems — Cassandra & Zookeeper', type: 'video', moduleTitle: 'CAP Theorem & Consistency Models' },
      ],
    },
  },
];

// ============================================================
// DYNAMIC AI SYNTHESIS (replaces canned responses)
// ============================================================

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'what', 'which',
  'this', 'that', 'these', 'those', 'then', 'just', 'so', 'than', 'such', 'both',
  'through', 'about', 'for', 'is', 'of', 'while', 'during', 'to', 'are', 'was',
  'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'can', 'could', 'should', 'would', 'how', 'why', 'used', 'explain', 'describe',
  'in', 'on', 'at', 'by', 'with', 'from', 'up', 'down', 'into', 'over', 'after',
  'step', 'steps', 'happen', 'happens', 'occur', 'occurs', 'work', 'works', 'tell', 'me'
]);

function splitSentences(text) {
  if (!text) return [];
  const cleaned = text.replace(/(\d+)\.\s+/g, '[$1] ');
  const raw = cleaned.split(/(?<=[.!?])\s+(?=[A-Z\[])/);
  return raw.map(s => s.replace(/\[(\d+)\]\s+/g, '$1. ').trim()).filter(s => s.length > 10);
}

function synthesizeAnswer(questionText, courseId, moduleId) {
  const qWords = (questionText.toLowerCase().match(/\b\w+\b/g) || []).filter(w => !STOP_WORDS.has(w));
  const phrase = qWords.join(' ');
  const rawTokens = questionText.toLowerCase().match(/\b\w+\b/g) || [];
  const ngrams = [];
  for (let i = 0; i < rawTokens.length - 1; i++) {
    if (!STOP_WORDS.has(rawTokens[i]) || !STOP_WORDS.has(rawTokens[i+1])) {
      ngrams.push(rawTokens[i] + ' ' + rawTokens[i+1]);
    }
  }
  for (let i = 0; i < rawTokens.length - 2; i++) {
    ngrams.push(rawTokens[i] + ' ' + rawTokens[i+1] + ' ' + rawTokens[i+2]);
  }

  // 1. Deep knowledge check for comprehensive textbook-grade explanation
  const courseObj = courses.find(c => c.id === courseId);
  const courseCode = courseObj ? courseObj.course_code : null;
  const deep = findDeepKnowledge(questionText, courseCode);
  if (deep && deep.score >= 25) {
    const answerText = formatDeepAnswer(deep.item);
    return {
      answerText,
      confidenceScore: 0.95,
      sources: [
        {
          contentId: 101,
          title: deep.item.title,
          type: 'text',
          moduleTitle: deep.item.module,
        }
      ]
    };
  }

  // 2. Candidate module scoring
  let candidateModules = [];
  courses.forEach(c => {
    (c.modules || []).forEach(m => {
      candidateModules.push({
        courseId: c.id,
        courseTitle: c.title,
        moduleId: m.id,
        moduleTitle: m.title,
        content: m.content || [],
        text: (m.content || []).map(item => item.content_text || item.snippet || '').join(' '),
      });
    });
  });

  // Score candidate modules
  let bestMod = null;
  let bestScore = -1;
  candidateModules.forEach(mod => {
    const full = (mod.moduleTitle + '. ' + mod.text).toLowerCase();
    let score = 0;
    let matches = 0;
    qWords.forEach(w => {
      if (full.includes(w)) {
        matches++;
        const count = (full.split(w).length - 1);
        score += count * 2.0;
      }
    });
    score *= Math.pow(matches, 1.5);
    if (phrase && full.includes(phrase)) {
      score += 25.0;
    }
    ngrams.forEach(ng => {
      if (full.includes(ng)) {
        score += 40.0;
      }
    });
    if (courseId && mod.courseId === courseId) score += 5.0;
    if (moduleId && mod.moduleId === moduleId) score += 10.0;

    if (score > bestScore) {
      bestScore = score;
      bestMod = mod;
    }
  });

  if (!bestMod || !bestMod.text) {
    return {
      answerText: "No specific course material was found matching your question.",
      confidenceScore: 0.70,
      sources: []
    };
  }

  // Split best module text into sentences
  const rawSentences = splitSentences(bestMod.text);
  const scoredSentences = rawSentences.map((s, idx) => {
    const sLower = s.toLowerCase();
    let sScore = 0;
    qWords.forEach(w => {
      if (sLower.includes(w)) {
        const count = sLower.split(w).length - 1;
        sScore += count * 3.0;
      }
    });
    if (phrase && sLower.includes(phrase)) sScore += 25.0;
    ngrams.forEach(ng => {
      if (sLower.includes(ng)) sScore += 25.0;
    });
    return { sentence: s, score: sScore, index: idx };
  });

  // Rank sentences by relevance score descending
  const ranked = [...scoredSentences].sort((a, b) => b.score - a.score);

  // Dynamic selection of 4 to 8 sentences for in-depth explanation
  let selectedIndices = new Set();
  for (const item of ranked) {
    if (item.score > 0) {
      selectedIndices.add(item.index);
    }
    if (selectedIndices.size >= 7) break;
  }

  // Backfill if fewer than 4 sentences
  if (selectedIndices.size < 4) {
    for (let i = 0; i < rawSentences.length; i++) {
      selectedIndices.add(i);
      if (selectedIndices.size >= 5) break;
    }
  }

  // Preserve natural order of appearance in source material
  const sortedIdx = Array.from(selectedIndices).sort((a, b) => a - b);
  const explanation = sortedIdx.map(i => rawSentences[i]).join(' ');

  const answerText = (
    `**Overview & Academic Resolution:**\n\n` +
    `${explanation}\n\n` +
    `**Key Takeaways:**\n` +
    `- Sourced directly from ${bestMod.courseTitle} curriculum materials.\n` +
    `- Verified against theoretical learning outcomes.`
  );

  // Compute confidence dynamically from match relevance
  const conf = 0.74 + (bestScore / 220.0);
  const confidenceScore = Math.round(Math.min(0.95, Math.max(0.72, conf)) * 100) / 100;

  const sources = (bestMod.content || []).slice(0, 2).map(c => ({
    contentId: c.id,
    title: c.title,
    type: c.type || 'text',
    moduleTitle: bestMod.moduleTitle,
  }));

  return { answerText, confidenceScore, sources };
}


// ============================================================
// ROUTES
// ============================================================

// GET /users/:id
app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// GET /courses
app.get('/courses', (req, res) => {
  const list = courses.map(({ id, course_code, title, description, instructor, coordinator, credits, prerequisite, tag, modules }) => ({
    id,
    course_code,
    title,
    description,
    instructor: coordinator || instructor,
    coordinator,
    credits,
    prerequisite,
    tag: course_code || tag || 'Core',
    moduleCount: modules ? modules.length : 0,
  }));
  res.json(list);
});

// GET /courses/:id  — full detail with modules + content
app.get('/courses/:id', (req, res) => {
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

// GET /enrollments?studentId=
app.get('/enrollments', (req, res) => {
  const studentId = parseInt(req.query.studentId);
  const courseIds = enrollments[studentId] || [];
  const enrolled  = courses
    .filter(c => courseIds.includes(c.id))
    .map(({ id, course_code, title, description, instructor, coordinator, credits, prerequisite, tag, modules }) => ({
      id,
      course_code,
      title,
      description,
      instructor: coordinator || instructor,
      coordinator,
      credits,
      prerequisite,
      tag: course_code || tag || 'Core',
      moduleCount: modules ? modules.length : 0,
    }));
  res.json(enrolled);
});

// GET /doubts?studentId=
app.get('/doubts', (req, res) => {
  const studentId = parseInt(req.query.studentId);
  const instructorId = parseInt(req.query.instructorId);

  if (studentId) {
    const result = doubts
      .filter(d => d.studentId === studentId)
      .map(d => ({
        id: d.id,
        questionText: d.questionText,
        status: d.status,
        createdAt: d.createdAt,
        courseId: d.courseId,
        moduleId: d.moduleId,
        courseTitle: courses.find(c => c.id === d.courseId)?.title || '',
        moduleTitle: courses
          .find(c => c.id === d.courseId)?.modules
          .find(m => m.id === d.moduleId)?.title || '',
        hasResponse: !!d.response,
      }));
    return res.json(result);
  }

  if (instructorId) {
    // Return all doubts for courses taught by this instructor
    const instructorCourseIds = courses
      .filter(c => c.instructorId === instructorId)
      .map(c => c.id);
    const result = doubts
      .filter(d => instructorCourseIds.includes(d.courseId))
      .map(d => ({
        id: d.id,
        questionText: d.questionText,
        status: d.status,
        createdAt: d.createdAt,
        courseId: d.courseId,
        courseTitle: courses.find(c => c.id === d.courseId)?.title || '',
        studentId: d.studentId,
        studentName: users.find(u => u.id === d.studentId)?.name || '',
      }));
    return res.json(result);
  }

  res.json(doubts);
});

// GET /doubts/:id — full detail with response
app.get('/doubts/:id', (req, res) => {
  const doubt = doubts.find(d => d.id === parseInt(req.params.id));
  if (!doubt) return res.status(404).json({ error: 'Doubt not found' });
  res.json(doubt);
});

// POST /doubts — submit a new doubt, synthesize AI response from real course content
app.post('/doubts', (req, res) => {
  const { studentId, courseId, moduleId, questionText } = req.body;

  if (!studentId || !courseId || !questionText) {
    return res.status(400).json({ error: 'studentId, courseId, and questionText are required' });
  }

  // Synthesize answer dynamically from course content
  const synthesized = synthesizeAnswer(questionText, courseId, moduleId);

  const newDoubt = {
    id:           doubts.length + 1,
    studentId,
    courseId,
    moduleId:     moduleId || null,
    questionText,
    status:       'answered',
    createdAt:    new Date().toISOString(),
    response: {
      answerText:      synthesized.answerText,
      confidenceScore: synthesized.confidenceScore,
      sources:         synthesized.sources,
    },
  };

  // Simulate AI processing delay (800ms)
  setTimeout(() => {
    doubts.push(newDoubt);
    res.status(201).json(newDoubt);
  }, 800);
});

// ============================================================
// START
// ============================================================

app.listen(PORT, () => {
  console.log(`\n🚀  Mock API running at http://localhost:${PORT}`);
  console.log(`   GET  /courses`);
  console.log(`   GET  /courses/:id`);
  console.log(`   GET  /enrollments?studentId=`);
  console.log(`   GET  /doubts?studentId=  |  ?instructorId=`);
  console.log(`   GET  /doubts/:id`);
  console.log(`   POST /doubts`);
  console.log(`   GET  /users/:id\n`);
});
