export interface Scores {
  T: number;
  E: number;
  S: number;
  K: number;
  R: number;
  [key: string]: number;
}

export interface Type {
  code: string;
  name: string;
  team: string;
  teamName: string | null;
  tagline: string;
  description: string;
  tags: string[];
  bestCP: string;
  worstCP: string;
  ideal: Scores;
}

export const types: Type[] = [
  // ==================== Big6 专属 ====================
  {
    code: 'ZERO',
    name: '冠压抑',
    team: 'ARS',
    teamName: '阿森纳',
    tagline: '你不是不相信奇迹，你只是不敢相信了。',
    description: '你是那种会在赛季初偷偷计算「夺冠概率」，却在圣诞节后就开始准备「速效救心丸」的典型阿森纳球迷。多年的「争四」和「掉链子」史让你形成了一种防御性人格：越是领先，你越紧张；越是踢得好看，你越担心补时绝杀。你的忠诚是不容置疑的，但你的韧性早已在一次次逆转中磨成了粉末。你对球队的要求极高，但内心深处其实只需要一个不让你失望的周六。',
    tags: ['防御性乐观', 'PTSD 晚期', '数学建模专家', '阿仙奴苦行僧'],
    bestCP: 'RIDE',
    worstCP: 'CTRL',
    ideal: { T: 4, E: 1, S: -1, K: 3, R: -4 },
  },
  {
    code: 'WENGER',
    name: '温格余党',
    team: 'ARS',
    teamName: '阿森纳',
    tagline: '赢了又怎样，这不是我们的足球。',
    description: '相比于冠军奖杯，你更在意传球的弧线和禁区前的三人配合。你的人格中带着一种「贵族式的偏执」，认为过程的优雅远比结果的丑陋更重要。你怀念那个法布雷加斯和亨利的时代，对现代足球的高压逼抢和身体对抗略带嫌弃。在你的世界里，足球是一场艺术表演，如果不能踢出「美丽足球」，即使拿了英超冠军，你也会觉得少了一份纯粹。',
    tags: ['理想主义者', '美学至上', '怀旧滤镜', '技术宅'],
    bestCP: 'FREE',
    worstCP: 'CAPS',
    ideal: { T: 2, E: -2, S: -2, K: 4, R: 1 },
  },
  {
    code: 'CTRL',
    name: '主动权持有者',
    team: 'MCI',
    teamName: '曼城',
    tagline: '在精密仪器的节奏里，焦虑是一种多余的干扰。',
    description: '你习惯了对场面的掌控感。不管是生活还是看球，你都追求极致的效率和逻辑。对于其他球队球迷那种「速效救心丸」式的心态，你内心是带着一丝优越感的——因为你相信体系。你的人格极度理性，甚至有点冷酷。你很少在直播间咆哮，因为你早在第 30 分钟就通过主队 70% 的控球率预判了结局。',
    tags: ['逻辑狂魔', '掌控欲', '数据驱动', '波澜不惊'],
    bestCP: 'REF',
    worstCP: 'ZERO',
    ideal: { T: 2, E: -4, S: -2, K: 5, R: 3 },
  },
  {
    code: 'SAF',
    name: '弗格森遗老',
    team: 'MUN',
    teamName: '曼联',
    tagline: '我见过山巅的风景，所以不屑与深渊和解。',
    description: '你的人格基底是高傲且深沉的。虽然现在的曼联让你头疼，但你骨子里的「豪门尊严」从未消失。你是一个典型的长期主义者，习惯了在低谷中寻找复兴的蛛丝马迹。你不像新入坑的粉丝那样容易破防，因为你经历过大风大浪。你对「DNA」有近乎执着的迷信，一直在等待那个能带回红魔精神的救世主。',
    tags: ['尊严至上', '硬核死忠', '冷峻观察者', '豪门滤镜'],
    bestCP: 'ZERO',
    worstCP: 'LOL',
    ideal: { T: 5, E: 1, S: -2, K: 1, R: 4 },
  },
  {
    code: 'QHI',
    name: '淇嗨型',
    team: 'MUN',
    teamName: '曼联',
    tagline: '新赛季的曼联会惊艳所有人，我是认真的。',
    description: '你是曼联球迷中的「永恒乐天派」。哪怕球队昨天刚输了 0-7，你今天依然能从新援的训练照里找出球队复兴的希望。你的人格充满了热血和感性，极具感染力。你是朋友圈里最活跃的转会官宣转发者，也是最容易因为一场逆转而泪洒现场的人。你不在乎数据分析，你只在乎那种「曼联永不言败」的情绪价值。',
    tags: ['热血少年', '情绪溢出', '官宣收割机', '复兴预言家'],
    bestCP: 'CAPS',
    worstCP: 'SAF',
    ideal: { T: 3, E: 5, S: 4, K: -3, R: 5 },
  },
  {
    code: 'M',
    name: '受虐狂',
    team: 'TOT',
    teamName: '热刺',
    tagline: '痛苦是我的养分，希望才是我的诅咒。',
    description: '你是英超球迷中韧性最强的一群人，强到有点让人心疼。你早已习惯了在「看到希望」和「瞬间崩盘」之间反复横跳。这种长期的人格拉扯让你产生了一种黑色幽默的防御机制——你甚至会和黑粉一起嘲笑自己的主队。你不需要冠军来证明忠诚，因为你坚持看热刺这门课本身就是忠诚的最高学分。',
    tags: ['自嘲之王', '极限抗压', '黑色幽默', '随遇而安'],
    bestCP: 'LOL',
    worstCP: 'CTRL',
    ideal: { T: 4, E: 1, S: 3, K: -1, R: -3 },
  },
  {
    code: 'HOLD',
    name: '无力股东',
    team: 'CHE',
    teamName: '切尔西',
    tagline: '我有钱，我有才，但我不知道我在干什么。',
    description: '你的人格正处于一种深刻的迷茫与挣扎中。曾经你以「铁血」和「效率」为荣，现在你只能对着一堆上亿身价的「刮刮乐」叹气。你对俱乐部的现状有极强的参与感，甚至想去直接找老板伯利谈谈。这种「无力感」让你变得易怒且挑剔，你比任何人都希望球队回到正轨，但又不知道路在哪里。',
    tags: ['操心命', '混乱守序', '豪掷千金', '迷茫死忠'],
    bestCP: 'ZERO',
    worstCP: 'CLOUD',
    ideal: { T: 4, E: 2, S: 0, K: 1, R: -3 },
  },
  {
    code: 'RIDE',
    name: '过山车乘客',
    team: 'LFC',
    teamName: '利物浦',
    tagline: '重金属足球的伴随者，心跳频率永远在超速边缘。',
    description: '你的人格里流淌着肾上腺素。你讨厌四平八稳的比赛，只有那种大开大合、满场飞奔的节奏能让你兴奋。你是一个极感性的人，很容易被更衣室文化和教练的个人魅力打动。你的看球体验就像是在安菲尔德坐过山车，上一分钟在巅峰，下一分钟在谷底。你不在乎过程是否完美，你只在乎那一刻的「爽感」。',
    tags: ['激情四射', '情绪极端', '重金属', '氛围组'],
    bestCP: 'M',
    worstCP: 'REF',
    ideal: { T: 3, E: 5, S: 3, K: -2, R: 2 },
  },

  // ==================== 跨球队通用 ====================
  {
    code: 'CAPS',
    name: '冠军粉',
    team: 'GEN',
    teamName: null,
    tagline: '在这个成王败寇的时代，我只与强者为伍。',
    description: '你的价值观非常纯粹：足球是为了赢。你对弱队的坚守嗤之以鼻，认为那是对时间的浪费。你的人格极度务实且结果导向，善于发现并追随最强的力量。你可能是转会窗口最活跃的人，因为你总能精准判断哪个球队才是新赛季的真神。你不需要历史包袱，你只要现在的荣耀。',
    tags: ['效率至上', '强者崇拜', '零包袱', '灵活立场'],
    bestCP: 'QHI',
    worstCP: 'WENGER',
    ideal: { T: -4, E: 0, S: 1, K: 3, R: 4 },
  },
  {
    code: 'REF',
    name: '中立执法官',
    team: 'GEN',
    teamName: null,
    tagline: '脱离低级趣味的情绪，我只为真相转身。',
    description: '你在球迷圈里就像是一个「裁判」。你的人格底色是客观与疏离。你看球不是为了寻找归属感，而是为了研究这项运动本身。你讨厌朋友圈里的无脑互黑，喜欢引用 Opta 数据和战术板图解。你的人格极其稳定，是那种在点球大战时还能冷静分析主罚队员心理活动的人。',
    tags: ['人间清醒', '战术大师', '数据复盘', '情感缺失'],
    bestCP: 'CTRL',
    worstCP: 'XXXX',
    ideal: { T: -3, E: -5, S: -2, K: 5, R: 4 },
  },
  {
    code: 'LOL',
    name: '乐子人',
    team: 'GEN',
    teamName: null,
    tagline: '比起谁夺冠，我更在乎今晚谁家房子塌了。',
    description: '足球对你来说不是信仰，而是一场大型真人秀。你的人格中带着一种解构主义的幽默，喜欢解构任何崇高的叙事。你是烂梗的搬运工，是回旋镖的记录者。哪里有大比分惨败，哪里就有你的身影。你不需要主队，因为全英超都是你的素材库。',
    tags: ['解构大师', '造梗机器', '快乐源泉', '旁观者'],
    bestCP: 'M',
    worstCP: 'SAF',
    ideal: { T: -5, E: 2, S: 5, K: -2, R: 3 },
  },
  {
    code: 'XXXX',
    name: '喷子',
    team: 'GEN',
    teamName: null,
    tagline: '对抗才是足球的真谛，沉默是对这项运动的背叛。',
    description: '你的人格中充满了攻击性和生命力。你认为足球场外的口水仗和球场内的肉搏同样精彩。你从不回避对抗，甚至主动寻找冲突。你的字典里没有「理中客」，只有「敌我」。虽然你经常让评论区鸡飞狗跳，但不得不承认，你也是球迷圈里参与感最强、投入感情最直接的一位。',
    tags: ['斗战胜佛', '立场先行', '全火力', '情绪引擎'],
    bestCP: 'QHI',
    worstCP: 'REF',
    ideal: { T: 0, E: 5, S: 5, K: -4, R: 2 },
  },
  {
    code: 'CLOUD',
    name: '云球迷',
    team: 'GEN',
    teamName: null,
    tagline: '比赛结束才是我的开球时间，集锦是我的入场券。',
    description: '你代表了快节奏生活下的现代球迷。你的人格务实且追求性价比。熬夜伤身，看全场浪费时间，你的策略是通过社交媒体完成所有的球迷体验。你可能叫不出所有首发的名字，但你一定知道当下的最火的梗。你的人格轻盈且灵活，足球对你来说只是生活的点缀。',
    tags: ['集锦专家', '速食主义', '社交补课', '精神观赛'],
    bestCP: 'LOL',
    worstCP: 'HOLD',
    ideal: { T: -3, E: -2, S: 2, K: -3, R: 1 },
  },
  {
    code: 'FREE',
    name: '化外之民',
    team: 'GEN',
    teamName: null,
    tagline: '争冠是你们的苦难，我看球纯粹是因为喜欢。',
    description: '你是英超球迷中的「隐士」。你可能支持一支中下游球队，或者根本没有固定主队，只是喜欢某几个球员或某种踢法。你的人格极度独立，不被主流舆论左右。你不在乎英超的商业营销，也不参与豪门之间的纷争。你的人格自洽且平静，足球对你来说是一种纯粹的美学或运动享受。',
    tags: ['随性而为', '去中心化', '纯粹热爱', '自洽人格'],
    bestCP: 'WENGER',
    worstCP: 'CAPS',
    ideal: { T: -1, E: -3, S: -4, K: 2, R: 4 },
  },
]

export const big6Teams = ['ARS', 'MUN', 'LFC', 'MCI', 'CHE', 'TOT']

export const teamNames: Record<string, string> = {
  ARS: '阿森纳',
  MUN: '曼联',
  LFC: '利物浦',
  MCI: '曼城',
  CHE: '切尔西',
  TOT: '热刺',
}

export const teamTypes: Record<string, string[]> = {}
for (const t of types) {
  if (t.team !== 'GEN') {
    if (!teamTypes[t.team]) teamTypes[t.team] = []
    teamTypes[t.team].push(t.code)
  }
}

export const genericTypes = types.filter(t => t.team === 'GEN').map(t => t.code)

export default types
