import { calculateResult } from './src/engine/scoring.js';
import { types } from './src/data/types.js';

// Mocking the environment for a quick node test
console.log('🧪 Starting Scoring Engine Test (18-Question Version)...');

// Case 1: Arsenal Fan (Zero type)
// Using 9 questions out of 18 is fine as the algorithm handles partial answers or specific subsets
const arsenalAnswers = [
  { questionId: 1, optionIndex: 0 }, // T:1, E:1
  { questionId: 4, optionIndex: 0 }, // K:1, teamHint: {ARS:2}
  { questionId: 5, optionIndex: 1 }, // R:-1, E:1
  { questionId: 6, optionIndex: 0 }, // E:2
  { questionId: 9, optionIndex: 0 }, // T:2
  { questionId: 10, optionIndex: 0 }, // K:1, teamHint: {ARS:2}
  { questionId: 13, optionIndex: 0 }, // T:2
  { questionId: 17, optionIndex: 0 }, // T:2, core
  { questionId: 18, optionIndex: 0 }, // T:2, core
];

const res1 = calculateResult(arsenalAnswers);
console.log('Test 1 (Arsenal/Zero):', res1.type?.code === 'ZERO' ? '✅ PASS' : `❌ FAIL (Got ${res1.type?.code})`);
console.log('Detected Team:', res1.detectedTeam === 'ARS' ? '✅ PASS' : `❌ FAIL (Got ${res1.detectedTeam})`);

// Case 2: Neutral / Ref type
const refAnswers = [
  { questionId: 1, optionIndex: 3 }, // T:-1, S:1
  { questionId: 4, optionIndex: 3 }, // generic
  { questionId: 5, optionIndex: 0 }, // R:2
  { questionId: 6, optionIndex: 1 }, // E:-1, K:1
  { questionId: 9, optionIndex: 2 }, // T:-2, K:1
  { questionId: 10, optionIndex: 3 }, // T:1, E:1
  { questionId: 13, optionIndex: 2 }, // K:1, R:1
  { questionId: 17, optionIndex: 1 }, // K:1, neutral
  { questionId: 18, optionIndex: 1 }, // K:2, neutral
];

const res2 = calculateResult(refAnswers);
console.log('Test 2 (Neutral/Ref):', (res2.type?.code === 'REF' || res2.type?.code === 'CTRL') ? '✅ PASS' : `❌ FAIL (Got ${res2.type?.code})`);

console.log('✨ All tests finished.');
