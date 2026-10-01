const fs = require('fs');
const path = require('path');

const seedDataPath = path.join(__dirname, '..', 'courses_seed_data.json');
const rawData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

let candidateModules = [];
rawData.courses.forEach(c => {
  (c.modules || []).forEach(m => {
    candidateModules.push({
      courseCode: c.course_code,
      courseTitle: c.title,
      moduleTitle: m.title,
      text: m.content || '',
    });
  });
});

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'what', 'which',
  'this', 'that', 'these', 'those', 'then', 'just', 'so', 'than', 'such', 'both',
  'through', 'about', 'for', 'is', 'of', 'while', 'during', 'to', 'are', 'was',
  'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'can', 'could', 'should', 'would', 'how', 'why', 'used', 'explain', 'describe',
  'in', 'on', 'at', 'by', 'with', 'from', 'up', 'down', 'into', 'over', 'after',
  'step', 'steps', 'happen', 'happens', 'occur', 'occurs', 'work', 'works', 'tell', 'me',
  'when', 'system', 'systems'
]);

function splitSentences(text) {
  if (!text) return [];
  // Split on period/question/exclamation followed by space and a letter,
  // but protect numbered lists like "1.", "2.", "Vector 14)." from being prematurely fragmented
  const cleaned = text.replace(/(\d+)\.\s+/g, '[$1] ');
  const raw = cleaned.split(/(?<=[.!?])\s+(?=[A-Z\[])/);
  return raw.map(s => s.replace(/\[(\d+)\]\s+/g, '$1. ').trim()).filter(s => s.length > 10);
}

function synthesize(questionText) {
  const qWords = (questionText.toLowerCase().match(/\b\w+\b/g) || []).filter(w => !STOP_WORDS.has(w));
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
    ngrams.forEach(ng => {
      if (full.includes(ng)) score += 40.0;
    });

    if (score > bestScore) {
      bestScore = score;
      bestMod = mod;
    }
  });

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
    ngrams.forEach(ng => {
      if (sLower.includes(ng)) sScore += 25.0;
    });
    return { sentence: s, score: sScore, index: idx };
  });

  // Sort by score descending to get highest relevance sentences
  const ranked = [...scoredSentences].sort((a, b) => b.score - a.score);
  const topMatch = ranked[0];

  let selectedIndices = new Set();
  if (topMatch && topMatch.score > 0) {
    // If the top match contains a colon, list, or step sequence, take the consecutive block starting from topMatch
    if (topMatch.sentence.includes(':') || /step|\d+\./i.test(topMatch.sentence) || /step/i.test(questionText)) {
      for (let i = topMatch.index; i < Math.min(rawSentences.length, topMatch.index + 4); i++) {
        selectedIndices.add(i);
      }
    } else {
      // Pick top scoring sentences
      ranked.filter(item => item.score > 0).slice(0, 4).forEach(item => selectedIndices.add(item.index));
    }
  }

  // Backfill if fewer than 3 sentences
  if (selectedIndices.size < 3) {
    for (let i = 0; i < rawSentences.length; i++) {
      selectedIndices.add(i);
      if (selectedIndices.size >= 4) break;
    }
  }

  // Preserve natural order of appearance in source material
  const sortedIdx = Array.from(selectedIndices).sort((a, b) => a - b);
  const answerText = sortedIdx.map(i => rawSentences[i]).join(' ');
  const conf = 0.72 + (bestScore / 220.0);
  const confidenceScore = Math.round(Math.min(0.95, Math.max(0.70, conf)) * 100) / 100;

  return { course: bestMod.courseCode, module: bestMod.moduleTitle, confidenceScore, answerText };
}

const tests = [
  'How does Gini impurity calculate split quality in decision trees?',
  'How does KMP avoid backtracking using the prefix failure function?',
  'What happens step by step when a page fault occurs in the operating system?',
  'Why is strict two-phase locking used instead of basic 2PL?'
];

tests.forEach(t => {
  const res = synthesize(t);
  console.log('==============================================');
  console.log('Q:', t);
  console.log('MATCHED MODULE:', res.course, '->', res.module);
  console.log('CONFIDENCE:', res.confidenceScore);
  console.log('ANSWER:\n' + res.answerText);
});
