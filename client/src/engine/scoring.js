// 评分引擎：原始分累加 → 归一化（0.8修正） → 主队检测（fanType增强） → 欧氏距离匹配
import { questions, maxPossibleScores } from '../data/questions.js'
import { types, big6Teams } from '../data/types.js'

/**
 * 根据用户答案计算结果类型
 * @param {Array<{questionId: number, optionIndex: number}>} answers
 * @returns {{ type, runnerUp, rawScores, normalized, detectedTeam }}
 */
export function calculateResult(answers) {
  // 1. 累加原始分、主队分、粉丝类型信号
  const rawScores = { T: 0, E: 0, S: 0, K: 0, R: 0 }
  const teamScores = {}
  let coreFanScore = 0 // 累计 fanType: core +2, neutral 0, casual -2

  for (const ans of answers) {
    const q = questions.find(q => q.id === ans.questionId)
    if (!q) continue
    const opt = q.options[ans.optionIndex]
    if (!opt) continue

    // 维度分累加
    for (const [dim, val] of Object.entries(opt.scores)) {
      rawScores[dim] = (rawScores[dim] || 0) + val
    }

    // 主队探测分 (Q4, Q10)
    if (opt.teamHint) {
      for (const [team, val] of Object.entries(opt.teamHint)) {
        teamScores[team] = (teamScores[team] || 0) + val
      }
    }

    // 粉丝类型信号 (Q17, Q18)
    if (opt.fanType === 'core') coreFanScore += 2
    else if (opt.fanType === 'casual') coreFanScore -= 2
    // neutral: no change
  }

  // 2. 检测主队（融入 fanType 信号）
  const detectedTeam = detectTeam(teamScores, coreFanScore)

  // 3. 归一化到 [-5, 5]，0.8 修正对抗均值回归
  const normalized = normalizeScores(rawScores)

  // 4. 筛选候选类型
  const candidates = getCandidates(detectedTeam)

  // 5. 欧氏距离匹配最近 + 次优
  const { best, runnerUp } = findClosestTypes(normalized, candidates)

  return {
    type: best,
    runnerUp,
    rawScores,
    normalized,
    detectedTeam,
  }
}

/**
 * 检测主队：基础阈值结合 fanType 调整灵敏度
 *
 * fanType 调整规则：
 * - coreFanScore ≥ 2（核心球迷）→ 降低阈值，更容易命中 Big6
 * - coreFanScore ≤ -2（泛球迷）→ 提高阈值，倾向于走通用匹配
 * - 中间值 → 维持默认阈值
 */
function detectTeam(teamScores, coreFanScore) {
  const entries = Object.entries(teamScores)
  if (entries.length === 0) {
    // 无 teamHint 数据但用户是核心球迷 → 尝试宽松匹配
    return coreFanScore >= 2 ? null : null
  }

  entries.sort((a, b) => b[1] - a[1])
  const [topTeam, topScore] = entries[0]
  const secondScore = entries.length > 1 ? entries[1][1] : 0
  const margin = topScore - secondScore

  // 动态阈值
  // 动态阈值（Q4 单题至少产出 2 分队信号，故默认阈值需 >2）
  let minScore, minMargin
  if (coreFanScore >= 2) {
    // 核心球迷：降阈值，更容易命中 Big6
    minScore = 2
    minMargin = 0
  } else if (coreFanScore <= -2) {
    // 泛球迷：提阈值，倾向走通用匹配
    minScore = 4
    minMargin = 2
  } else {
    // 默认：需要超过纯 Q4 信号的强度才判定为 Big6
    minScore = 3
    minMargin = 1
  }

  if (topScore >= minScore && margin >= minMargin && big6Teams.includes(topTeam)) {
    return topTeam
  }

  return null
}

/**
 * 归一化原始分到 [-5, 5]，0.8 系数修正
 *
 * 不加修正时 scores 会因"均值回归"效应聚集在 0 附近。
 * /0.8 等价于 *1.25，将分数撑开，提升距离匹配的敏感度。
 */
function normalizeScores(raw) {
  const CORRECTION = 0.8
  const norm = {}
  for (const dim of ['T', 'E', 'S', 'K', 'R']) {
    const maxAbs = maxPossibleScores[dim] || 1
    const val = (raw[dim] / maxAbs) * 5 / CORRECTION
    norm[dim] = Math.max(-5, Math.min(5, val))
  }
  return norm
}

/**
 * 根据检测到的主队获取候选类型
 */
function getCandidates(detectedTeam) {
  if (detectedTeam && big6Teams.includes(detectedTeam)) {
    return types.filter(t => t.team === detectedTeam)
  }
  return types.filter(t => t.team === 'GEN')
}

/**
 * 欧氏距离匹配最近 + 次优人格类型
 */
function findClosestTypes(normalized, candidates) {
  if (candidates.length === 0) return { best: null, runnerUp: null }

  const scored = candidates.map(t => ({
    type: t,
    dist: euclideanDist(normalized, t.ideal),
  }))
  scored.sort((a, b) => a.dist - b.dist)

  return {
    best: scored[0].type,
    runnerUp: scored.length > 1 ? scored[1].type : null,
  }
}

/**
 * 计算两个五维坐标的欧氏距离
 */
function euclideanDist(a, b) {
  const dims = ['T', 'E', 'S', 'K', 'R']
  let sumSq = 0
  for (const d of dims) {
    sumSq += Math.pow((a[d] || 0) - (b[d] || 0), 2)
  }
  return Math.sqrt(sumSq)
}

export default calculateResult
