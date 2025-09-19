// Simple AI generation service (OpenAI-compatible API)
const fetch = require('node-fetch');

/**
 * Generate virtual news content using an OpenAI-compatible endpoint.
 * @param {Object} options
 * @param {string} options.apiKey - API key (from request, not stored)
 * @param {Object} options.world - worldsetting object
 * @param {string} [options.model="gpt-4o-mini"] - model name
 * @param {string} [options.baseUrl] - API base URL (default https://api.openai.com)
 * @param {string} [options.category] - anime|manga|novel|local
 * @param {string} [options.titleHint] - optional title hint
 * @param {string} [options.tone] - narrative tone/style
 * @param {number} [options.length=400] - expected body length in Chinese characters
 * @param {number} [options.temperature=0.8]
 */
async function generateVirtualNews({ apiKey, world, model = 'gpt-4o-mini', baseUrl, category, titleHint, tone, length = 400, temperature = 0.8 }) {
  if (!apiKey) throw new Error('缺少 API Key');
  const endpoint = `${(baseUrl || 'https://api.openai.com').replace(/\/$/, '')}/v1/chat/completions`;

  const system = [
    '你是一个创作虚拟新闻的系统。严格遵守以下规则：',
    '1) 所有内容全部为虚构，不得出现现实中的地名、人名、国家、组织、品牌与可识别实体。',
    '2) 禁止涉及恐怖主义、色情、血腥、惊悚等敏感内容。',
    '3) 语言风格应贴合世界观设定，确保自洽。',
    '4) 不要输出任何与现实直接相关的描述或影射。',
  ].join('\n');

  const worldSeg = world ? `世界观：${JSON.stringify(world, null, 2)}` : '世界观：未提供，保持完全虚构与安全';
  const preset = [
    worldSeg,
    `类别：${category || 'general'}`,
    `风格：${tone || '新闻纪实与世界观叙述融合，保持克制且具画面感'}`,
    `长度：约${length}字（不必严格）`
  ].join('\n');

  const user = [
    '请生成一篇虚拟新闻。输出JSON对象，字段：title, content。',
    '要求：',
    '- 标题不包含现实专有名词。',
    '- 正文300-600字，叙述清晰、设定一致。',
    '- 不得包含现实地名、人名、国家等。',
    '- 不涉及恐怖主义、色情、血腥、惊悚等。',
    titleHint ? `- 标题方向提示：${titleHint}` : '',
    '',
    '仅输出JSON，无需多余解释。例子：{"title":"...","content":"..."}'
  ].filter(Boolean).join('\n');

  const body = {
    model,
    temperature,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: `${preset}\n\n${user}` }
    ]
  };

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI 生成失败: ${resp.status} ${text}`);
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || '';
  let parsed;
  try { parsed = JSON.parse(content); } catch {
    // 尝试从代码块或非纯JSON中提取
    const match = content.match(/\{[\s\S]*\}/);
    if (match) { parsed = JSON.parse(match[0]); }
  }
  if (!parsed || !parsed.title || !parsed.content) {
    throw new Error('AI 返回格式不符合预期');
  }
  return parsed;
}

module.exports = { generateVirtualNews };

// Lightweight API key test using models endpoint
async function testApiKey({ apiKey, baseUrl }) {
  if (!apiKey) throw new Error('缺少 API Key');
  const endpoint = `${(baseUrl || 'https://api.openai.com').replace(/\/$/, '')}/v1/models`;
  const resp = await fetch(endpoint, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  if (!resp.ok) {
    const text = await resp.text();
    return { ok: false, status: resp.status, message: text.slice(0, 200) };
  }
  return { ok: true };
}

module.exports.testApiKey = testApiKey;


