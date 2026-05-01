export interface Option {
  text: string;
  scores: Partial<Record<'T' | 'E' | 'S' | 'K' | 'R', number>>;
  teamHint?: Record<string, number>;
  fanType?: 'core' | 'neutral' | 'casual';
}

export interface Question {
  id: number;
  text: string;
  category: string;
  options: Option[];
}

export const questions: Question[] = [
  {
    id: 1,
    text: '你的主队最近战绩不佳，此时你刷到死敌赢球的新闻，你的第一反应是？',
    category: 'team',
    options: [
      { text: '血压升高，直接关掉 App', scores: { T: 1, E: 1 } },
      { text: '习惯了，甚至想看看对方是怎么赢的', scores: { R: -1, K: 1 } },
      { text: '只要不影响我队争四/保级，随他去', scores: { T: 1, R: 1 } },
      { text: '足球嘛，风水轮流转，看个热闹', scores: { T: -1, S: 1 } },
    ],
  },
  {
    id: 2,
    text: '在球迷群或评论区，你通常扮演什么角色？',
    category: 'social',
    options: [
      { text: '战术分析师，喜欢发长文复盘', scores: { K: 2, S: 1 } },
      { text: '活跃分子，发表情包和烂梗的高手', scores: { S: 2, E: 1 } },
      { text: '潜水员，只在赢球或重大新闻时出来冒泡', scores: { S: -1, T: 1 } },
      { text: '孤狼，从不加群，只看新闻和直播', scores: { S: -2 } },
    ],
  },
  {
    id: 3,
    text: '你如何评价一支球队的"豪门底蕴"？',
    category: 'knowledge',
    options: [
      { text: '荣誉室里的奖杯数量', scores: { K: 1, T: 1 } },
      { text: '逆境中永不言弃的精神属性', scores: { R: 1, E: 1 } },
      { text: '即使落魄也坚持的纯粹打法', scores: { K: 1, R: -1 } },
      { text: '说不清，这是一种玄学氛围', scores: { E: 1, K: -1 } },
    ],
  },
  {
    id: 4,
    text: '如果让你选择一个主场氛围体验，你最想去？',
    category: 'team',
    options: [
      { text: '酋长球场：看最华丽的配合', scores: { K: 1 }, teamHint: { ARS: 2 } },
      { text: '老特拉福德：感受历史的沉重', scores: { T: 1 }, teamHint: { MUN: 2 } },
      { text: '安菲尔德：听全场齐唱 YNWA', scores: { E: 1 }, teamHint: { LFC: 2 } },
      { text: '伊蒂哈德/斯坦福桥/白鹿巷：见证现代足球的效率或残酷', scores: {}, teamHint: { MCI: 1, CHE: 1, TOT: 1 } },
    ],
  },
  {
    id: 5,
    text: '比赛第 85 分钟，你的主队 0-1 落后，你此时的状态是？',
    category: 'resilience',
    options: [
      { text: '还没哨响就有机会，盯着转播屏不放', scores: { R: 2 } },
      { text: '已经开始在脑子里打辞职报告/骂教练了', scores: { R: -1, E: 1 } },
      { text: '准备关电视睡觉，不想影响明天心情', scores: { R: -1, T: -1 } },
      { text: '甚至想看看对面能不能再进一个，看看到底能多烂', scores: { R: -2, S: 1 } },
    ],
  },
  {
    id: 6,
    text: '看球时，你会大声呐喊或摔枕头吗？',
    category: 'emotion',
    options: [
      { text: '会，邻居经常以为我家发生了家暴', scores: { E: 2 } },
      { text: '很少，我更倾向于冷静地分析失误', scores: { E: -1, K: 1 } },
      { text: '只有在补时绝杀那种时刻才会失控', scores: { E: 1, T: 1 } },
      { text: '从不，我甚至可以边看球边写代码/写作业', scores: { E: -2 } },
    ],
  },
  {
    id: 7,
    text: '你对转会流言的态度通常是？',
    category: 'knowledge',
    options: [
      { text: '每一个 ID 都要去查集锦和数据', scores: { K: 2 } },
      { text: '树上人太多，不到官宣不下树', scores: { T: 1, R: 1 } },
      { text: '只关心身价和名气，能不能带流量', scores: { S: 1, E: 1 } },
      { text: '随缘，反正买谁我也决定不了', scores: { T: -1 } },
    ],
  },
  {
    id: 8,
    text: '当你的主队被称为"抬价联"、"伦敦马戏团"或"利记过山车"时，你会？',
    category: 'resilience',
    options: [
      { text: '亲自下场自黑，甚至比黑粉还狠', scores: { R: 1, S: 1 } },
      { text: '感到被冒犯，反唇相讥', scores: { T: 1, E: 1 } },
      { text: '默默收藏表情包，以后骂主队时用', scores: { R: -1, S: 1 } },
      { text: '关我什么事，我只是来看球的', scores: { T: -1 } },
    ],
  },
  {
    id: 9,
    text: '如果你支持的球队降级了，你会？',
    category: 'team',
    options: [
      { text: '继续看英冠，死守到底', scores: { T: 2 } },
      { text: '可能会减少关注，等他们升级再回来', scores: { T: -1, R: -1 } },
      { text: '转而关注英超里踢得好看的其他球队', scores: { T: -2, K: 1 } },
      { text: '刚好借机戒掉足球，太累了', scores: { T: -2, R: -2 } },
    ],
  },
  {
    id: 10,
    text: '你最讨厌哪种类型的输球？',
    category: 'team',
    options: [
      { text: '全场占优却被偷一个', scores: { K: 1 }, teamHint: { ARS: 2, MCI: 2 } },
      { text: '毫无斗志地惨败', scores: { R: -1 }, teamHint: { MUN: 2, CHE: 2 } },
      { text: '领先到最后时刻崩盘', scores: { E: 1 }, teamHint: { TOT: 2, LFC: 2 } },
      { text: '只要输了都讨厌，不分类型', scores: { T: 1, E: 1 } },
    ],
  },
  {
    id: 11,
    text: '你转发足球新闻到朋友圈的主要动力是？',
    category: 'social',
    options: [
      { text: '记录主队的里程碑时刻', scores: { T: 1 } },
      { text: '展示自己的懂球程度', scores: { K: 1, S: 1 } },
      { text: '寻找共同语言，希望有人互动', scores: { S: 2 } },
      { text: '纯粹为了发泄情绪或玩梗', scores: { E: 1, S: 1 } },
    ],
  },
  {
    id: 12,
    text: '你认为金元足球（如曼城、纽卡）对英超的影响是？',
    category: 'knowledge',
    options: [
      { text: '破坏了足球的纯粹性和竞争公平', scores: { T: 1, R: -1 } },
      { text: '提升了英超的整体水平和观赏度', scores: { K: 1, S: -1 } },
      { text: '无所谓，反正是资本的游戏', scores: { T: -1, E: -1 } },
      { text: '只要能买到我想看的球星就行', scores: { E: 1, S: 1 } },
    ],
  },
  {
    id: 13,
    text: '当球队连续五年无冠，支撑你继续看下去的动力是？',
    category: 'team',
    options: [
      { text: '习惯成自然，它已是我生活的一部分', scores: { T: 2 } },
      { text: '相信低谷之后必有巅峰', scores: { R: 2 } },
      { text: '即使没冠，看他们踢球的过程也是享受', scores: { K: 1, R: 1 } },
      { text: '主要是为了和老队友/老群友有个聊天话题', scores: { S: 2 } },
    ],
  },
  {
    id: 14,
    text: '你会和支持死敌的朋友在现实中讨论足球吗？',
    category: 'social',
    options: [
      { text: '经常，甚至会互相疯狂输出', scores: { S: 1, E: 1 } },
      { text: '尽量避免，怕伤感情', scores: { S: -1, E: -1 } },
      { text: '只讨论技术，不讨论立场', scores: { K: 2, S: -1 } },
      { text: '互相嘲讽是我们的友谊基石', scores: { S: 2, R: 1 } },
    ],
  },
  {
    id: 15,
    text: '赛季开始前，你对主队的预期通常是？',
    category: 'resilience',
    options: [
      { text: '永远争冠，哪怕阵容不如人', scores: { R: 1, E: 1 } },
      { text: '目标前四/保级，务实一点', scores: { R: -1, K: 1 } },
      { text: '不崩盘就行，不敢有期待', scores: { R: -2 } },
      { text: '只要踢得好看，排名无所谓', scores: { K: 1, E: 1 } },
    ],
  },
  {
    id: 16,
    text: '你更看重球员的？',
    category: 'knowledge',
    options: [
      { text: '忠诚度和斗志', scores: { T: 1, E: 1 } },
      { text: '技战术执行力和数据表现', scores: { K: 2 } },
      { text: '商业价值和人气', scores: { S: 1 } },
      { text: '灵光一现的天赋', scores: { E: 1, K: -1 } },
    ],
  },
  {
    id: 17,
    text: '你觉得自己更像哪种类型的球迷？',
    category: 'identity',
    options: [
      { text: '守护者：主队就是一切', scores: { T: 2 }, fanType: 'core' },
      { text: '观察者：冷眼看英超变迁', scores: { K: 1, T: -1 }, fanType: 'neutral' },
      { text: '乐天派：足球带给我快乐', scores: { E: 1, R: 1 }, fanType: 'neutral' },
      { text: '流浪者：哪里的风景好就看哪里', scores: { T: -2, S: 1 }, fanType: 'casual' },
    ],
  },
  {
    id: 18,
    text: '如果只能选一个，你希望你的主队？',
    category: 'identity',
    options: [
      { text: '踢得丑但能拿冠军', scores: { T: 2, K: -1 }, fanType: 'core' },
      { text: '坚持美丽足球但颗粒无收', scores: { K: 2, T: -1 }, fanType: 'neutral' },
      { text: '成为全球流量最高的网红球队', scores: { S: 2, E: 1 }, fanType: 'casual' },
      { text: '永远稳定在前六，不折腾', scores: { R: 1, T: 1 }, fanType: 'core' },
    ],
  },
];

// 运行时自动计算每维度最大可能绝对值，避免改题后忘记同步
function computeMaxPossibleScores(): Record<string, number> {
  const dims = ['T', 'E', 'S', 'K', 'R'];
  const maxes: Record<string, number> = {};
  for (const dim of dims) {
    let total = 0;
    for (const q of questions) {
      let maxAbs = 0;
      for (const opt of q.options) {
        const val = opt.scores[dim as 'T' | 'E' | 'S' | 'K' | 'R'] || 0;
        if (Math.abs(val) > maxAbs) maxAbs = Math.abs(val);
      }
      total += maxAbs;
    }
    maxes[dim] = total;
  }
  return maxes;
}

export const maxPossibleScores = computeMaxPossibleScores();

export default questions;
