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

// AI全量审核
async function fullReview(text) {
  if (!config.ai.apiKey || !config.ai.apiEndpoint) return null;

  const snippet = text.substring(0, 60000);

  const prompt = `审核以下合同，检出所有风险。仅输出JSON，无风险则risks为空数组。

检查项：违约责任|个人信息泄露(身份证/手机/银行卡/地址)|模糊表述(合理期限/酌情/视情况/适当补偿)|管辖权与争议解决|保密条款|知识产权归属|不可抗力|金额大小写|签署日期|通知送达|关键条款缺失

文书：
${snippet}

输出格式（严格JSON，勿输出其他）：
{"risks":[{"risk_level":"high|medium|low","category":"","rule_name":"","description":"引用原文证据","suggestion":""}],"summary":"100字内整体结论"}

risk_level判定：涉金额/权利/法律→high，表述模糊/程序性→medium，格式/完整性→low`;

  const aiResult = await callAI([{
    role: 'system',
    content: '合同审核专家，仅输出JSON。',
  }, {
    role: 'user',
    content: prompt,
  }], 2048);

  if (!aiResult) return null;

  try {
    const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (_) {
    console.error('[AI] JSON解析失败:', aiResult);
  }
  return null;
}

module.exports = { fullReview };
