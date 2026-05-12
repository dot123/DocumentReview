const { ReviewRecord, File } = require('../models');
const aiService = require('./aiService');


// 主审核函数
async function reviewFile(fileId, userId) {
  const startTime = Date.now();

  try {
    // 查找已有的待审核记录（上传时自动创建），没有则新建
    let record = await ReviewRecord.findOne({
      where: { file_id: fileId, user_id: userId, status: 'pending' },
    });
    if (!record) {
      record = await ReviewRecord.create({
        user_id: userId,
        file_id: fileId,
        status: 'pending',
      });
    }

    // 获取文件文本内容
    const file = await File.findOne({ where: { id: fileId, user_id: userId } });
    if (!file || !file.text_content) {
      await record.update({ status: 'failed', results: { error: '文件内容为空' } });
      return record;
    }

    // 更新状态为处理中
    await record.update({ status: 'processing' });

    const text = file.text_content;

    // AI全量审核：AI直接分析全文并输出风险项
    const aiReviewResult = await aiService.fullReview(text).catch(() => null);

    // 解析AI返回的风险项
    const results = { high: [], medium: [], low: [] };
    let aiSummary = '';

    if (aiReviewResult) {
      const risks = aiReviewResult.risks || [];
      for (const risk of risks) {
        const level = risk.risk_level || 'medium';
        if (results[level]) {
          results[level].push({
            rule_name: risk.rule_name || 'AI检测风险',
            category: risk.category || 'AI综合分析',
            risk_level: level,
            description: risk.description || '',
            suggestion: risk.suggestion || '',
          });
        }
      }
      aiSummary = aiReviewResult.summary || '';
    }

    const totalRisks = results.high.length + results.medium.length + results.low.length;

    // 汇总风险统计
    const riskSummary = {
      total: totalRisks,
      high: results.high.length,
      medium: results.medium.length,
      low: results.low.length,
      ai_enhanced: true,
    };

    const duration = Math.round((Date.now() - startTime) / 1000);

    // 更新审核记录
    await record.update({
      status: 'completed',
      results: { details: results, ai: aiSummary ? { summary: aiSummary } : null },
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

module.exports = { reviewFile };
