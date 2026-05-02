import fetch from 'node-fetch';

/**
 * 通用 LLM API 调用封装
 * 兼容所有 OpenAI 格式的 API（DeepSeek / MiMo / OpenAI / …）
 * 
 * 通过 .env 环境变量切换供应商:
 *   MIMO_API_KEY    - API 密钥（必填）
 *   MIMO_API_URL    - 接口地址（默认 DeepSeek）
 *   MIMO_MODEL      - 模型名称（默认 deepseek-chat）
 * 
 * 常见配置示例:
 *   DeepSeek V4:  URL=https://api.deepseek.com/v1/chat/completions  MODEL=deepseek-chat
 *   MiMo:         URL=https://api.xiaomimimo.com/v1/chat/completions MODEL=mimo-v2.5-pro
 */
export async function callMiMoAPI(prompt, options = {}) {
  const apiKey = process.env.MIMO_API_KEY;
  if (!apiKey) {
    throw new Error('MIMO_API_KEY is not set in environment variables');
  }

  const messages = Array.isArray(prompt) 
    ? prompt 
    : [{ role: 'user', content: prompt }];

  const apiUrl = process.env.MIMO_API_URL || 'https://api.deepseek.com/v1/chat/completions';
  const model = options.model || process.env.MIMO_MODEL || 'deepseek-chat';
  const stream = !!options.stream;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.85,
        max_tokens: options.maxTokens ?? 800,
        stream
      }),
      signal: options.signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`LLM API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    if (stream) {
      return response.body; // Return the stream directly
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (err) {
    console.error('❌ callMiMoAPI failed:', err.message);
    throw err;
  }
}
