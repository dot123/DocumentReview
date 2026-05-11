const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { logAction } = require('../middleware/logger');
const { ReviewRecord, File } = require('../models');
const reviewService = require('../services/reviewService');

// 开始审核
router.post('/:fileId', requireAuth, async (req, res) => {
  try {
    const { fileId } = req.params;

    // 检查文件是否存在且属于当前用户
    const file = await File.findOne({ where: { id: fileId, user_id: req.userId } });
    if (!file) {
      return res.status(404).json({ code: 404, message: '文件不存在' });
    }
    if (!file.text_content) {
      return res.status(400).json({ code: 400, message: '文件尚未解析，请先预览文件' });
    }

    // 已有处理中的审核则阻止重复提交（pending状态允许，那是上传时自动创建的）
    const processing = await ReviewRecord.findOne({
      where: { file_id: fileId, user_id: req.userId, status: 'processing' },
    });
    if (processing) {
      return res.status(400).json({ code: 400, message: '该文件正在审核中' });
    }

    // 异步执行审核（实际项目可用消息队列）
    reviewService.reviewFile(fileId, req.userId).catch(err => {
      console.error('审核任务异常:', err);
    });

    // 立即返回，审核异步进行
    res.json({ code: 0, message: '审核任务已提交，请稍后查看结果' });
  } catch (err) {
    console.error('提交审核失败:', err);
    res.status(500).json({ code: 500, message: '提交审核失败' });
  }
}, logAction('start_review', 'review'));

// 获取审核结果
router.get('/:recordId', requireAuth, async (req, res) => {
  try {
    const record = await ReviewRecord.findOne({
      where: { id: req.params.recordId, user_id: req.userId },
      include: [{ model: File, as: 'file', attributes: ['id', 'original_name', 'file_type', 'file_size'] }],
    });
    if (!record) {
      return res.status(404).json({ code: 404, message: '审核记录不存在' });
    }
    res.json({ code: 0, data: record });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取审核结果失败' });
  }
});

// 审核记录列表
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const { rows, count } = await ReviewRecord.findAndCountAll({
      where: { user_id: req.userId },
      include: [{ model: File, as: 'file', attributes: ['id', 'original_name', 'file_type', 'file_size'] }],
      attributes: ['id', 'file_id', 'status', 'risk_summary', 'duration', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: parseInt(offset),
    });

    res.json({
      code: 0,
      data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) },
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取审核记录失败' });
  }
});

module.exports = router;
