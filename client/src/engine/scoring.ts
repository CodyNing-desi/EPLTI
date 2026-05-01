import { questions, maxPossibleScores } from '../data/questions';
import { types, big6Teams, Type, Scores } from '../data/types';

export interface Answer {
  questionId: number;
  optionIndex: number;
}

export interface QuizResult {
  type: Type | null;
  runnerUp: Type | null;
  rawScores: Scores;
  normalized: Scores;
  detectedTeam: string | null;
}

export function calculateResult(answers: Answer[]): QuizResult {
  const rawScores: Scores = { T: 0, E: 0, S: 0, K: 0, R: 0 };
  const teamScores: Record<string, number> = {};
  let coreFanScore = 0;

  for (const ans of answers) {
    const q = questions.find(q => q.id === ans.questionId);
    if (!q) continue;
    const opt = q.options[ans.optionIndex];
    if (!opt) continue;

    for (const [dim, val] of Object.entries(opt.scores)) {
      if (val !== undefined) {
        rawScores[dim] = (rawScores[dim] || 0) + val;
      }
    }

    if (opt.teamHint) {
      for (const [team, val] of Object.entries(opt.teamHint)) {
        teamScores[team] = (teamScores[team] || 0) + val;
      }
    }

    if (opt.fanType === 'core') coreFanScore += 2;
    else if (opt.fanType === 'casual') coreFanScore -= 2;
  }

  const detectedTeam = detectTeam(teamScores, coreFanScore);
  const normalized = normalizeScores(rawScores);
  const candidates = getCandidates(detectedTeam);
  const { best, runnerUp } = findClosestTypes(normalized, candidates);

  return {
    type: best,
    runnerUp,
    rawScores,
    normalized,
    detectedTeam,
  };
}

function detectTeam(teamScores: Record<string, number>, coreFanScore: number): string | null {
  const entries = Object.entries(teamScores);
  if (entries.length === 0) {
    return null;
  }

  entries.sort((a, b) => b[1] - a[1]);
  const [topTeam, topScore] = entries[0];
  const secondScore = entries.length > 1 ? entries[1][1] : 0;
  const margin = topScore - secondScore;

  let minScore, minMargin;
  if (coreFanScore >= 2) {
    minScore = 2;
    minMargin = 0;
  } else if (coreFanScore <= -2) {
    minScore = 4;
    minMargin = 2;
  } else {
    minScore = 3;
    minMargin = 1;
  }

  if (topScore >= minScore && margin >= minMargin && big6Teams.includes(topTeam)) {
    return topTeam;
  }

  return null;
}

function normalizeScores(raw: Scores): Scores {
  const CORRECTION = 0.8;
  const norm: Scores = { T: 0, E: 0, S: 0, K: 0, R: 0 };
  for (const dim of ['T', 'E', 'S', 'K', 'R']) {
    const maxAbs = maxPossibleScores[dim] || 1;
    const val = (raw[dim] / maxAbs) * 5 / CORRECTION;
    norm[dim] = Math.max(-5, Math.min(5, val));
  }
  return norm;
}

function getCandidates(detectedTeam: string | null): Type[] {
  if (detectedTeam && big6Teams.includes(detectedTeam)) {
    return types.filter(t => t.team === detectedTeam);
  }
  return types.filter(t => t.team === 'GEN');
}

function findClosestTypes(normalized: Scores, candidates: Type[]): { best: Type | null, runnerUp: Type | null } {
  if (candidates.length === 0) return { best: null, runnerUp: null };

  const scored = candidates.map(t => ({
    type: t,
    dist: euclideanDist(normalized, t.ideal),
  }));
  scored.sort((a, b) => a.dist - b.dist);

  return {
    best: scored[0].type,
    runnerUp: scored.length > 1 ? scored[1].type : null,
  };
}

function euclideanDist(a: Scores, b: Scores): number {
  const dims = ['T', 'E', 'S', 'K', 'R'];
  let sumSq = 0;
  for (const d of dims) {
    sumSq += Math.pow((a[d] || 0) - (b[d] || 0), 2);
  }
  return Math.sqrt(sumSq);
}

export default calculateResult;
