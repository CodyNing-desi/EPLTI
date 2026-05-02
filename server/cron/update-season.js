import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { callMiMoAPI } from '../lib/mimo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const CONTEXT_PATH = path.join(__dirname, '../data/season-context.json');

/**
 * 自动化赛事情报 Agent
 * 流程：抓取裸数据 -> AI 生成叙事与情绪 -> 更新 JSON
 */
async function updateSeason() {
  console.log('🚀 Starting season context update agent...');

  try {
    let standingsData, resultsData;

    if (FOOTBALL_DATA_API_KEY) {
      console.log('📡 Fetching real data from football-data.org...');
      const headers = { 'X-Auth-Token': FOOTBALL_DATA_API_KEY };
      
      const standingsRes = await fetch('https://api.football-data.org/v4/competitions/PL/standings', { headers });
      if (!standingsRes.ok) throw new Error(`Standings API error: ${standingsRes.status}`);
      standingsData = await standingsRes.json();

      const resultsRes = await fetch('https://api.football-data.org/v4/competitions/PL/matches?status=FINISHED', { headers });
      if (!resultsRes.ok) throw new Error(`Matches API error: ${resultsRes.status}`);
      resultsData = await resultsRes.json();
    } else {
      console.warn('⚠️ FOOTBALL_DATA_API_KEY missing, using mock data for AI simulation.');
      // 模拟数据用于测试 AI 生成逻辑
      standingsData = {
        season: { currentMatchday: 35 },
        standings: [{ table: [
          { team: { name: 'Liverpool', tla: 'LFC' }, points: 82, position: 1 },
          { team: { name: 'Arsenal', tla: 'ARS' }, points: 79, position: 2 },
          { team: { name: 'Manchester City', tla: 'MCI' }, points: 75, position: 3 },
          { team: { name: 'Chelsea', tla: 'CHE' }, points: 63, position: 4 },
          { team: { name: 'Manchester United', tla: 'MUN' }, points: 55, position: 7 },
          { team: { name: 'Tottenham Hotspur', tla: 'TOT' }, points: 52, position: 9 }
        ]}]
      };
      resultsData = {
        matches: [
          { homeTeam: { name: 'Arsenal' }, awayTeam: { name: 'Newcastle United' }, score: { fullTime: { home: 0, away: 1 } } },
          { homeTeam: { name: 'Manchester City' }, awayTeam: { name: 'Wolverhampton Wanderers' }, score: { fullTime: { home: 3, away: 0 } } },
          { homeTeam: { name: 'Tottenham Hotspur' }, awayTeam: { name: 'Liverpool' }, score: { fullTime: { home: 2, away: 4 } } }
        ].reverse() // 取最近
      };
    }

    const gameweek = standingsData.season?.currentMatchday || 0;
    const top6 = standingsData.standings?.[0]?.table?.slice(0, 10) || [];
    const recent = resultsData.matches?.filter(m => m.status === 'FINISHED').slice(-5) || [];

    const prompt = `
你是一位精通英超的资深分析师。请根据以下裸数据，为“英超球迷人格测试”系统生成本周的赛季上下文。

【裸数据】
- 当前轮次: 第 ${gameweek} 轮
- 积分榜前列: ${top6.map(s => `${s.position}.${s.team.name}(${s.points}分)`).join(', ')}
- 最近关键赛果: ${recent.map(m => `${m.homeTeam.name} ${m.score.fullTime.home}-${m.score.fullTime.away} ${m.awayTeam.name}`).join('; ')}

【输出要求】
1. 严格输出 JSON 格式，不要包含任何 Markdown 代码块标签或额外文字。
2. 球队名称使用中文简称（如：利物浦、曼联、热刺）。
3. mood 字段要毒舌、有梗、符合当前球迷心态（比如阿森纳掉链子后的崩溃）。
4. narrative 要精炼（30字以内）。

【JSON 结构】
{
  "gameweek": ${gameweek},
  "updated": "${new Date().toISOString().split('T')[0]}",
  "season": "2025-26",
  "standings": [
    { "team": "ARS", "name": "阿森纳", "points": 分数, "pos": 排名 },
    ... (必须包含 Big6: ARS, MUN, LFC, MCI, CHE, TOT)
  ],
  "recent_results": ["简短赛果描述", ...],
  "narrative": "赛季叙事",
  "mood": {
    "ARS": "情绪描述",
    "MUN": "情绪描述",
    "LFC": "情绪描述",
    "MCI": "情绪描述",
    "CHE": "情绪描述",
    "TOT": "情绪描述"
  },
  "hot_topics": ["话题1", "话题2", "话题3"]
}
`;

    console.log('🤖 Sending context to AI for narrative generation...');
    const aiResponse = await callMiMoAPI(prompt, { temperature: 0.8 });
    
    // 清理并解析 JSON
    const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    let newContext;
    try {
      newContext = JSON.parse(cleanJson);
    } catch (e) {
      console.error('❌ AI output is not valid JSON. Raw output:');
      console.log(aiResponse);
      return;
    }

    // 简单校验
    if (!newContext.mood || !newContext.standings) {
      console.error('❌ AI output missing required fields.');
      return;
    }

    // 写入文件
    fs.writeFileSync(CONTEXT_PATH, JSON.stringify(newContext, null, 2));
    console.log(`\n✅ Update Complete!`);
    console.log(`GW: ${newContext.gameweek} | Updated: ${newContext.updated}`);
    console.log(`Narrative: ${newContext.narrative}`);

  } catch (err) {
    console.error('❌ Update failed:', err.message);
  }
}

updateSeason();
