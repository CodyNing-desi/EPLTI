import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { callMiMoAPI } from '../lib/mimo.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { getCache, setCache } from '../lib/redis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

// Few-shot 语料库：注入地道的“英超老哥/懂球帝”风格
const BANTER_FEW_SHOT = `
对话风格范例：
- “就这防线，我奶奶上去都能防得住。”
- “别问，问就是争四狂魔 DNA 动了。”
- “天亮了，索圣下课了，曼联球迷过年了。”
- “这集我看过，又是 85 分钟被绝杀，心疼你的速效救心丸。”
- “看球不为了速死，难道为了养生？咱们这种人格就是天生的速死派。”
- “懂球帝看了都要流泪，你的战术分析比滕哈赫还要‘滕’。”
`;

// AI 接口限频
const aiLimit = rateLimit({ max: 5 });

/**
 * 加载赛季上下文
 */
function loadSeasonContext() {
  const contextPath = path.join(__dirname, '../data/season-context.json');
  if (fs.existsSync(contextPath)) {
    return JSON.parse(fs.readFileSync(contextPath, 'utf8'));
  }
  return null;
}

/**
 * 调用 MiMo API 的安全包装 (带降级逻辑)
 */
async function safeCallMiMo(prompt, options, fallback) {
  if (!process.env.MIMO_API_KEY) {
    console.warn('⚠️ MIMO_API_KEY not found, using fallback content.');
    return typeof fallback === 'function' ? fallback() : fallback;
  }
  try {
    return await callMiMoAPI(prompt, options);
  } catch (err) {
    console.error('MiMo API call failed:', err.message);
    return typeof fallback === 'function' ? fallback() : fallback;
  }
}
router.post('/insight', aiLimit, async (req, res) => {
  try {
    const { type_code, normalized, detected_team, stream = false } = req.body;
    if (!type_code || !normalized) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const season = loadSeasonContext();
    const teamStatus = detected_team && season 
      ? season.standings.find(s => s.team === detected_team) 
      : null;
    const teamMood = detected_team && season ? season.mood[detected_team] : null;
    const gameweek = season?.gameweek || 0;

    // 尝试从缓存获取
    const cacheKey = `insight:${gameweek}:${type_code}:${detected_team || 'NONE'}`;
    const cached = await getCache(cacheKey);

    if (cached) {
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: cached } }] })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }
      return res.json({ ok: true, insight: cached });
    }

    const prompt = `你是一位毒舌但有洞察力的英超球迷心理分析师。

【当前赛事背景】
- ${season ? `第 ${season.gameweek} 轮，${season.narrative}` : '本赛季争冠已进入白热化'}
${teamStatus ? `- 该球迷主队 ${teamStatus.name} 目前积分榜第 ${teamStatus.pos} 名，${teamStatus.points} 分，当前情绪：${teamMood}` : ''}

【用户画像】
- 人格类型：${type_code}
- 五维得分：T(死忠)=${normalized.T?.toFixed?.(1) ?? normalized.T}, E(激情)=${normalized.E?.toFixed?.(1) ?? normalized.E}, S(社交)=${normalized.S?.toFixed?.(1) ?? normalized.S}, K(懂球)=${normalized.K?.toFixed?.(1) ?? normalized.K}, R(韧性)=${normalized.R?.toFixed?.(1) ?? normalized.R}

${BANTER_FEW_SHOT}

请写一段 150-200 字的个性化深度解读：
1. 结合【当前积分形势和最近赛果】分析这位球迷此刻的心理状态。
2. 根据分数极端的维度给出精准吐槽。
3. 语气幽默、有梗，像老球迷间的互黑，但要有心理深度。
4. 最后给一句专属的"本轮球迷箴言"（15字以内）。`;

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const abortController = new AbortController();
      req.on('close', () => abortController.abort());

      const streamBody = await callMiMoAPI(prompt, { 
        stream: true,
        signal: abortController.signal
      });
      
      let fullContent = '';
      streamBody.on('data', chunk => {
        const chunkStr = chunk.toString();
        const lines = chunkStr.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              fullContent += data.choices[0]?.delta?.content || '';
            } catch (e) {}
          }
        }
      });

      streamBody.on('end', () => {
        if (fullContent) setCache(cacheKey, fullContent);
      });

      streamBody.on('error', (err) => {
        if (err.name !== 'AbortError') {
          console.error('Insight Stream error:', err.message);
        }
      });

      streamBody.pipe(res);
      return;
    }

    const fallback = () => `作为一名「${type_code}」，你目前的五维指标显示出极强的${normalized.T > 2 ? '死忠度' : '个性'}。在当前的赛季形势下，建议保持冷静，毕竟足球是圆的。`;
    const insight = await safeCallMiMo(prompt, {}, fallback);
    
    if (insight && insight !== fallback()) {
      setCache(cacheKey, insight);
    }
    
    res.json({ ok: true, insight });
  } catch (err) {
    console.error('Insight generation error:', err);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

/**
 * POST /api/ai/compare - AI 对比 PK
 */
router.post('/compare', aiLimit, async (req, res) => {
  try {
    const { type1, type2, score, stream = false } = req.body;
    const prompt = `分析英超球迷人格「${type1}」和「${type2}」的合拍程度。合拍分数为 ${score}/100。
请写一段 120 字左右的毒舌点评：
1. 分析这两种人格看球时是否会打起来。
2. 结合英超梗说明他们的共同点或冲突点。
3. 语气要像老球迷在酒吧聊球。

${BANTER_FEW_SHOT}`;
    
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      const abortController = new AbortController();
      req.on('close', () => abortController.abort());

      const streamBody = await callMiMoAPI(prompt, { 
        stream: true, 
        temperature: 0.9,
        signal: abortController.signal
      });
      streamBody.on('error', (err) => {
        if (err.name !== 'AbortError') {
          console.error('Compare Stream error:', err.message);
        }
      });
      streamBody.pipe(res);
      return;
    }

    const fallback = `这对组合就像是克洛普遇到了西蒙尼，虽然画风迥异，但在对足球的执着上出奇地一致。合拍度 ${score}% 说明了一切。`;
    const analysis = await safeCallMiMo(prompt, { temperature: 0.9 }, fallback);
    res.json({ ok: true, analysis });
  } catch (err) {
    res.status(500).json({ error: 'Comparison failed' });
  }
});

/**
 * POST /api/ai/poster-line - 生成海报金句
 */
router.post('/poster-line', aiLimit, async (req, res) => {
  try {
    const { type_code, detected_team } = req.body;
    const season = loadSeasonContext();
    
    const prompt = `为一位「${type_code}」类型的英超球迷写一句海报金句（15-25字）。
${season ? `当前第${season.gameweek}轮，${season.narrative}。` : ''}
${detected_team ? `其主队：${detected_team}` : ''}
要求：必须包含该人格的核心特质，语气要适合发朋友圈。只输出金句本身，不要引号。`;

    const line = await callMiMoAPI(prompt, { maxTokens: 100, temperature: 0.95 });
    res.json({ ok: true, line: line.trim() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate poster line' });
  }
});

// 对话历史管理（优先使用 Redis，回退到内存以防止内存泄漏）
const conversationStore = new Map(); // 仅作为 Redis 不可用时的降级

/**
 * POST /api/ai/chat - 和球迷人格对话
 */
router.post('/chat', aiLimit, async (req, res) => {
  try {
    const { message, type_code, normalized, detected_team, sessionId, stream = false } = req.body;
    if (!message || !type_code || !sessionId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const season = loadSeasonContext();
    const typeName = type_code; 
    const sessionKey = `chat:${sessionId}`;

    // 尝试从 Redis 获取历史
    let history = await getCache(sessionKey);
    
    // 如果 Redis 拿不到且没连上 Redis，回退到内存 Map (仅限极端情况)
    if (!history) {
      history = conversationStore.get(sessionId) || [];
    }
    
    // 初始化对话上下文
    if (history.length === 0) {
      history.push({
        role: 'system',
        content: `你是一位资深英超球迷，同时也是专业的球迷心理分析师。

你正在和一位「${typeName}」类型的球迷聊天。
该球迷的五维画像：T(死忠)=${normalized?.T}, E(激情)=${normalized?.E}, S(社交)=${normalized?.S}, K(懂球)=${normalized?.K}, R(韧性)=${normalized?.R}
${detected_team ? `其主队是 ${detected_team}` : '该球迷没有固定主队'}

当前赛季背景：${season ? `第${season.gameweek}轮，${season.narrative}` : '赛季争冠关键期'}

对话准则：
1. 你的风格：像一个资深老球迷，幽默、毒舌、接地气。会用足球梗（如"DNA动了"、"下课"、"天亮了"）。
2. 根据他的人格类型调整态度：对 R 分数低的要多扎心（反讽），对 S 分数高的可以聊八卦，对 K 分数高的多聊战术。
3. 聊天要自然，不要像机器人客服。不要总是提他的测试结果，除非那是吐槽的点。
4. 每次回复控制在 100 字左右，鼓励多轮互动。

${BANTER_FEW_SHOT}`
      });
    }

    history.push({ role: 'user', content: message });

    // 限制历史长度
    if (history.length > 20) history = [history[0], ...history.slice(-19)];

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const abortController = new AbortController();
      req.on('close', () => abortController.abort());

      const streamBody = await callMiMoAPI(history, { 
        stream: true,
        temperature: 0.9,
        maxTokens: 400,
        signal: abortController.signal
      });
      
      // 流式输出结束后，更新缓存（这里需要监听流结束）
      let fullReply = '';
      streamBody.on('data', chunk => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              fullReply += data.choices[0]?.delta?.content || '';
            } catch (e) {}
          }
        }
      });

      streamBody.on('end', async () => {
        if (fullReply) {
          history.push({ role: 'assistant', content: fullReply });
          await setCache(sessionKey, history, 86400); // 24h
        }
      });

      streamBody.on('error', (err) => {
        if (err.name !== 'AbortError') {
          console.error('Chat Stream error:', err.message);
        }
      });

      streamBody.pipe(res);
      return;
    }

    const fallback = '我现在的信号有点不稳定，可能是曼城的主场屏蔽了外网。我们待会再聊？';

    const reply = await safeCallMiMo(history, { 
      temperature: 0.9,
      maxTokens: 400
    }, fallback);

    history.push({ role: 'assistant', content: reply });
    
    // 更新缓存
    await setCache(sessionKey, history, 86400); // 24h
    conversationStore.set(sessionId, history); // 兜底内存备份

    res.json({ ok: true, reply });
  } catch (err) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ error: 'Chat failed', message: err.message });
  }
});

export default router;
