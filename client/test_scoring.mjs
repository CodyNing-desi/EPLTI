// 模拟测试：验证 14 种人格在极端输入下是否能命中自身
// 用法：node test_scoring.mjs
import { questions } from './src/data/questions.js'
import { types, big6Teams } from './src/data/types.js'
import { calculateResult } from './src/engine/scoring.js'

const dims = ['T', 'E', 'S', 'K', 'R']

/**
 * 为给定目标类型生成"理想答题"，使分数尽量逼近其理想坐标
 */
function simulateAnswers(targetType) {
  const answers = []

  for (const q of questions) {
    let bestIdx = 0
    let bestScore = -Infinity

    q.options.forEach((opt, idx) => {
      let score = 0
      // 每个维度：朝着 target ideal 方向加分
      for (const dim of dims) {
        const target = targetType.ideal[dim]
        const move = opt.scores[dim] || 0
        // 如果 target 是正，选正分；target 是负，选负分
        score += move * target
      }
      // teamHint: Big6 类型必须选对主队; 通用类型必须避开
      if (opt.teamHint) {
        if (targetType.team !== 'GEN') {
          // 强权重：主队信号优先级高于维度分，确保进入正确候选池
          score += (opt.teamHint[targetType.team] || 0) * 20
        } else {
          // 通用类型：有 teamHint 就扣分，避免误入 Big6 候选池
          score -= Object.values(opt.teamHint).reduce((a, b) => a + b, 0) * 10
        }
      }
      // fanType: core 球迷倾向 Big6，casual 倾向通用
      if (opt.fanType) {
        if (targetType.team !== 'GEN' && opt.fanType === 'core') score += 4
        if (targetType.team === 'GEN' && opt.fanType === 'casual') score += 4
        if (targetType.team !== 'GEN' && opt.fanType === 'casual') score -= 4
        if (targetType.team === 'GEN' && opt.fanType === 'core') score -= 4
      }
      if (score > bestScore) {
        bestScore = score
        bestIdx = idx
      }
    })

    answers.push({ questionId: q.id, optionIndex: bestIdx })
  }

  return answers
}

// ==================== 运行测试 ====================
console.log('='.repeat(60))
console.log('英超TI 评分引擎模拟测试')
console.log('='.repeat(60))

let passCount = 0
let nearCount = 0 // 次优命中
const failDetails = []

for (const type of types) {
  const answers = simulateAnswers(type)
  const result = calculateResult(answers)
  const hit = result.type.code === type.code
  const nearHit = !hit && result.runnerUp && result.runnerUp.code === type.code
  const symbol = hit ? '✓' : (nearHit ? '≈' : '✗')

  if (hit) {
    passCount++
  } else if (nearHit) {
    nearCount++
  }

  if (!hit) {
    failDetails.push({
      expected: `${type.code} ${type.name}`,
      got: `${result.type.code} ${result.type.name}`,
      runnerUp: result.runnerUp ? `${result.runnerUp.code} ${result.runnerUp.name}` : 'N/A',
      nearHit,
      team: type.team,
    })
  }

  const teamLabel = type.team !== 'GEN' ? type.team : 'GEN'
  const runnerUpInfo = result.runnerUp ? ` | 次优: ${result.runnerUp.code}` : ''
  const dist = Math.sqrt(
    dims.reduce((s, d) => s + Math.pow((result.normalized[d] || 0) - (type.ideal[d] || 0), 2), 0)
  ).toFixed(2)

  console.log(
    `  ${symbol} ${type.code.padEnd(6)} ${type.name.padEnd(8)} → ${result.type.code.padEnd(6)} ${result.type.name.padEnd(8)}` +
    ` | team: ${teamLabel.padEnd(4)} detected: ${(result.detectedTeam || 'GEN').padEnd(4)}` +
    ` | dist: ${dist}${runnerUpInfo}`
  )
}

console.log('='.repeat(60))
const total = types.length
console.log(`精确命中: ${passCount}/${total} (${(passCount / total * 100).toFixed(1)}%)`)
if (nearCount > 0) {
  console.log(`次优命中: ${nearCount}/${total}`)
  console.log(`综合命中率 (Top-2): ${passCount + nearCount}/${total} (${((passCount + nearCount) / total * 100).toFixed(1)}%)`)
}

if (failDetails.length > 0) {
  console.log('\n未命中详情:')
  for (const f of failDetails) {
    const label = f.nearHit ? '[次优]' : '[未命中]'
    console.log(`  ${label} 预期: ${f.expected} → 实际: ${f.got} (次优: ${f.runnerUp})`)
  }
}

// 额外: 测试极端分布（全选A、全选B等）
console.log('\n--- 极端答题模式 ---')
const patterns = ['全 A 党', '全 B 党', '全 C 党', '全 D 党']
patterns.forEach((label, idx) => {
  const answers = questions.map(q => ({ questionId: q.id, optionIndex: idx }))
  const result = calculateResult(answers)
  console.log(`  ${label}: ${result.type.code} ${result.type.name} | team: ${result.detectedTeam || 'GEN'}`)
})

console.log('='.repeat(60))
