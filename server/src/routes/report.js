const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { ReviewRecord, File } = require('../models');
const reportService = require('../services/reportService');

// 获取报告数据
router.get('/:recordId', requireAuth, async (req, res) => {
  try {
    const record = await ReviewRecord.findOne({
      where: { id: req.params.recordId, user_id: req.userId },
    });
    if (!record) return res.status(404).json({ code: 404, message: '审核记录不存在' });
    if (record.status !== 'completed') return res.status(400).json({ code: 400, message: '审核尚未完成' });

    const file = await File.findOne({ where: { id: record.file_id } });
    res.json({ code: 0, data: reportService.buildReportData(record, file) });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取报告失败' });
  }
});

// 导出PDF报告
router.get('/:recordId/export', requireAuth, async (req, res) => {
  try {
    const record = await ReviewRecord.findOne({
      where: { id: req.params.recordId, user_id: req.userId },
    });
    if (!record) return res.status(404).json({ code: 404, message: '审核记录不存在' });
    if (record.status !== 'completed') return res.status(400).json({ code: 400, message: '审核尚未完成' });

    const file = await File.findOne({ where: { id: record.file_id } });
    const pdfBuffer = await reportService.generatePdf(
      reportService.buildReportData(record, file)
    );

    const encodedName = encodeURIComponent(`审核报告_${file.original_name}`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('导出报告失败:', err);
    res.status(500).json({ code: 500, message: '导出报告失败' });
  }
});

module.exports = router;
