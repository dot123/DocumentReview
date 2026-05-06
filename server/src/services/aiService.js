const config = require('../config');

// 调用AI接口（通用OpenAI兼容格式）
async function callAI(messages, maxTokens = 1024) {
  if (!config.ai.apiKey || !config.ai.apiEndpoint) {
    console.log('[AI] 未配置API Key，跳过');
    return null;
  }

  const axios = require('axios');
  const payload = {
    model: config.ai.model || 'deepseek-chat',
    messages,
    max_tokens: maxTokens,
    temperature: 0.3,
  };

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[AI] 请求接口:', config.ai.apiEndpoint + '/v1/chat/completions');
  console.log('[AI] 模型:', payload.model);
  console.log('[AI] System:', messages[0]?.content?.substring(0, 80) + '...');
  console.log('[AI] User:', messages[1]?.content?.substring(0, 200) + '...');
  console.log('[AI] max_tokens:', maxTokens);

  const startTime = Date.now();
  try {
    const res = await axios.post(config.ai.apiEndpoint + '/v1/chat/completions', payload, {
      headers: {
        'Authorization': `Bearer ${config.ai.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const content = res.data.choices?.[0]?.message?.content || null;
    const elapsed = Date.now() - startTime;
    const tokens = res.data.usage;

    console.log('[AI] 响应耗时:', elapsed + 'ms');
    if (tokens) console.log('[AI] Token用量: prompt=' + tokens.prompt_tokens + ' completion=' + tokens.completion_tokens + ' total=' + tokens.total_tokens);
    console.log('[AI] 响应内容:', content);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return content;
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error('[AI] 调用失败 (' + elapsed + 'ms):', err.response?.data || err.message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return null;
  }
}

// AI辅助审核（审核完成后增强结果）
async function assistReview(text, rules) {
  if (!config.ai.apiKey || !config.ai.apiEndpoint) return null;

  // 截取文本前3000字发送给AI
  const snippet = text.substring(0, 3000);
  const rulesDesc = rules
    .filter(r => r.is_active)
    .map(r => `[${r.risk_level}] ${r.name}: ${r.description}`)
    .join('\n');

  const aiResult = await callAI([{
    role: 'system',
    content: '你是合同文书审核专家。根据检测到的风险项，从以下维度总结：1)关键词筛查结果 2)条款完整性 3)潜在漏洞 4)整体风险等级。给出3-5条关键建议。用中文回复，100字以内。',
  }, {
    role: 'user',
    content: `检测到的风险项:\n${rulesDesc}\n\n文书内容摘要:\n${snippet}\n\n请审核并总结关键问题。`,
  }], 512);

  if (!aiResult) return null;
  return { summary: aiResult };
}

// 针对单个风险项生成AI建议
async function enhanceSuggestion(ruleName, description, context) {
  if (!config.ai.apiKey || !config.ai.apiEndpoint) return null;

  const result = await callAI([{
    role: 'system',
    content: '你是法律文书审核助手。根据检测到的风险条款，给出一句话的具体修改建议。',
  }, {
    role: 'user',
    content: `检测到风险: ${ruleName}\n说明: ${description}\n原文上下文: ${context}\n\n请给出一句话的具体修改建议。`,
  }], 256);

  return result;
}

// AI辅助文本提取（用于格式复杂的文档）
async function assistTextExtraction(rawText) {
  if (!config.ai.apiKey || !config.ai.apiEndpoint) return rawText;
  if (rawText.length < 500) return rawText;

  const result = await callAI([{
    role: 'system',
    content: '你是文档解析助手。去除文档中的无关内容（页眉页脚、水印、格式标记等），保留正文。',
  }, {
    role: 'user',
    content: `请清理以下文档内容，去除干扰信息，保留合同条款正文:\n\n${rawText.substring(0, 4000)}`,
  }], 2048);

  return result || rawText;
}

module.exports = { assistReview, enhanceSuggestion, assistTextExtraction };
