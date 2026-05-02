export interface SeasonContext {
  gameweek: number;
  updated: string;
  season: string;
  standings: any[];
  recent_results: string[];
  narrative: string;
  mood: Record<string, string>;
  hot_topics: string[];
}

export const questionContexts: Record<number, (ctx: SeasonContext) => string | null> = {
  // Q1: 死敌赢球
  1: (ctx) => {
    return ctx.narrative ? `📰 最新速递：${ctx.narrative}\n——在这个节骨眼上，如果看到对手春风得意，你的第一反应是？` : null;
  },
  // Q5: 85分钟0-1落后
  5: (ctx) => {
    const upset = ctx.recent_results.find(r => r.includes('0-1') || r.includes('1-2'));
    return upset ? `📺 像不像刚发生的 ${upset}？\n——现在想象你的主队也陷入了这种僵局：` : null;
  },
  // Q9: 主队降级
  9: (ctx) => {
    const bottom = ctx.standings.filter(s => s.pos >= 18).map(s => s.name);
    return bottom.length > 0 
      ? `⚠️ 本赛季降级区告急：${bottom.join('、')}\n——如果你的主队也面临这种深渊：` 
      : null;
  },
  // Q18: 踢得丑拿冠 vs 美丽足球
  18: (ctx) => {
    const topTeam = ctx.standings[0]?.name;
    return topTeam ? `🏆 看着 ${topTeam} 在榜首领跑，你会如何选择主队的通往荣耀之路？` : null;
  }
};
