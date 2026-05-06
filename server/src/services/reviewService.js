const { ReviewRule, ReviewRecord, File } = require('../models');
const aiService = require('./aiService');

// 关键词匹配引擎
function matchKeywords(text, keywords) {
  const matched = [];
  for (const kw of keywords) {
    // 支持模糊匹配：关键词出现即命中
    if (text.includes(kw)) {
      // 找出关键词在文本中的上下文
      const idx = text.indexOf(kw);
      const start = Math.max(0, idx - 30);
      const end = Math.min(text.length, idx + kw.length + 30);
      matched.push({
        keyword: kw,
        position: idx,
        context: (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : ''),
      });
    }
  }
  return matched;
}

// 正则匹配引擎
function matchRegex(text, pattern) {
  try {
    const regex = new RegExp(pattern, 'g');
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        match: match[0],
        position: match.index,
      });
    }
    return matches;
  } catch (_) {
    return [];
  }
}

// 条件匹配引擎
// condition规则：keywords数组内所有关键词都出现才算命中
function matchCondition(text, keywords) {
  const allMatched = keywords.every(kw => text.includes(kw));
  if (allMatched) {
    return [{ matched: true, keywords }];
  }
  return [];
}

// 主审核函数
async function reviewFile(fileId, userId) {
  const startTime = Date.now();

  try {
    // 更新状态为处理中
    const record = await ReviewRecord.create({
      user_id: userId,
      file_id: fileId,
      status: 'processing',
    });

    // 获取文件文本内容
    const file = await File.findOne({ where: { id: fileId, user_id: userId } });
    if (!file || !file.text_content) {
      await record.update({ status: 'failed', results: { error: '文件内容为空' } });
      return record;
    }

    const text = file.text_content;

    // 获取所有启用的规则
    const rules = await ReviewRule.findAll({ where: { is_active: true } });

    const results = {
      high: [],
      medium: [],
      low: [],
    };
    let totalRisks = 0;

    // 遍历规则执行匹配
    for (const rule of rules) {
      let matches = [];
      const keywords = rule.keywords ? (Array.isArray(rule.keywords) ? rule.keywords : JSON.parse(rule.keywords)) : [];

      switch (rule.rule_type) {
        case 'keyword':
          matches = matchKeywords(text, keywords);
          break;
        case 'regex':
          matches = matchRegex(text, rule.pattern);
          break;
        case 'condition':
          matches = matchCondition(text, keywords);
          break;
      }

      if (matches.length > 0) {
        const riskItem = {
          rule_id: rule.id,
          rule_name: rule.name,
          category: rule.category,
          risk_level: rule.risk_level,
          description: rule.description,
          suggestion: rule.suggestion,
          matches: matches.slice(0, 5), // 最多保留5个匹配项
          match_count: matches.length,
        };

        results[rule.risk_level].push(riskItem);
        totalRisks++;
      }
    }

    // 去重比对 - 简单的simhash比对
    const allFiles = await File.findAll({
      where: { user_id: userId },
      attributes: ['id', 'text_content'],
    });
    let similarityResults = [];
    // 仅与其他文件做简单比对
    const sentences = text.split(/[。！？\n]/).filter(s => s.trim().length > 20);
    for (const other of allFiles) {
      if (other.id === fileId || !other.text_content) continue;
      const simCount = sentences.filter(s => other.text_content.includes(s)).length;
      if (simCount > 5) {
        similarityResults.push({
          file_id: other.id,
          similar_sentences: simCount,
          total_sentences: sentences.length,
        });
      }
    }

    // 可选：AI辅助审查
    let aiResults = null;
    try {
      aiResults = await aiService.assistReview(text, rules);
    } catch (_) { /* AI服务不可用时跳过 */ }

    // 汇总风险统计
    const riskSummary = {
      total: totalRisks,
      high: results.high.length,
      medium: results.medium.length,
      low: results.low.length,
      similarity: similarityResults.length > 0 ? similarityResults : null,
      ai_enhanced: aiResults !== null,
    };

    const duration = Math.round((Date.now() - startTime) / 1000);

    // 更新审核记录
    await record.update({
      status: 'completed',
      results: { details: results, similarity: similarityResults, ai: aiResults },
      risk_summary: riskSummary,
      duration,
    });

    return record;
  } catch (err) {
    console.error('审核失败:', err);
    await ReviewRecord.update(
      { status: 'failed', results: { error: err.message } },
      { where: { file_id: fileId, user_id: userId } }
    );
    throw err;
  }
}

module.exports = { reviewFile, matchKeywords, matchRegex, matchCondition };
