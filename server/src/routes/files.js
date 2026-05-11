const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { Op } = require('sequelize');
const { requireAuth } = require('../middleware/auth');
const { logAction } = require('../middleware/logger');
const { File, User, ReviewRecord } = require('../models');
const uploadService = require('../services/uploadService');
const parseService = require('../services/parseService');
const { v4: uuidv4 } = require('uuid');

// 会员每日上传限制
const MEMBER_LIMITS = { free: 5, vip: 20, svip: 50 };

// multer配置 - 接收分片文件
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 单分片10MB
});

// 直接上传（base64方式，无需分片）
router.post('/upload/direct', requireAuth, async (req, res) => {
  try {
    const { original_name, file_type, file_size, data_base64 } = req.body;
    if (!original_name || !file_type || !data_base64) {
      return res.status(400).json({ code: 400, message: '参数不完整' });
    }

    // 检查限额
    const user = await User.findByPk(req.userId);
    const limit = MEMBER_LIMITS[user.member_level || 'free'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await File.count({
      where: { user_id: req.userId, created_at: { [Op.gte]: today } },
    });
    if (todayCount >= limit) {
      return res.status(400).json({ code: 400, message: '上传失败，今日上传次数已用完' });
    }

    const fileKey = `${uuidv4()}_${original_name}`;
    const buffer = Buffer.from(data_base64, 'base64');
    const filePath = uploadService.getFilePath(req.userId, fileKey);
    require('fs').writeFileSync(filePath, buffer);

    const file = await File.create({
      user_id: req.userId,
      filename: fileKey,
      original_name,
      file_type,
      file_size: file_size || buffer.length,
      cos_key: filePath,
      upload_status: 'completed',
    });

    // 上传后自动创建待审核记录
    await ReviewRecord.create({ user_id: req.userId, file_id: file.id, status: 'pending' });

    res.json({ code: 0, message: '上传成功', data: { id: file.id } });
  } catch (err) {
    console.error('上传失败:', err);
    res.status(500).json({ code: 500, message: '上传失败' });
  }
});

// 初始化分片上传
router.post('/upload/init', requireAuth, async (req, res) => {
  try {
    const { filename, file_type, total_chunks } = req.body;
    if (!filename || !file_type || !total_chunks) {
      return res.status(400).json({ code: 400, message: '参数不完整' });
    }

    // 检查会员上传限制
    const user = await User.findByPk(req.userId);
    const limit = MEMBER_LIMITS[user.member_level || 'free'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await File.count({
      where: { user_id: req.userId, created_at: { [Op.gte]: today } },
    });
    if (todayCount >= limit) {
      return res.status(400).json({ code: 400, message: '上传失败，今日上传次数已用完' });
    }
    const fileKey = `${uuidv4()}_${filename}`;
    uploadService.initChunkUpload(req.userId, fileKey, parseInt(total_chunks));
    res.json({ code: 0, data: { fileKey } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '初始化上传失败' });
  }
});

// 上传分片（支持base64和multipart两种方式）
router.post('/upload/chunk', upload.single('chunk'), async (req, res) => {
  try {
    const { fileKey, chunk_index, data_base64 } = req.body;
    if (!fileKey || chunk_index === undefined) {
      return res.status(400).json({ code: 400, message: '参数不完整' });
    }
    let buffer;
    if (data_base64) {
      buffer = Buffer.from(data_base64, 'base64');
    } else if (req.file) {
      buffer = req.file.buffer;
    } else {
      return res.status(400).json({ code: 400, message: '缺少文件数据' });
    }
    uploadService.saveChunk(req.userId, fileKey, parseInt(chunk_index), buffer);
    res.json({ code: 0, message: `分片${chunk_index}上传成功` });
  } catch (err) {
    res.status(500).json({ code: 500, message: `分片上传失败: ${err.message}` });
  }
});

// 合并分片并完成上传
router.post('/upload/complete', requireAuth, async (req, res) => {
  try {
    const { fileKey, original_name, file_type, file_size } = req.body;
    if (!fileKey || !original_name || !file_type) {
      return res.status(400).json({ code: 400, message: '参数不完整' });
    }

    // 合并分片（无分片时创建空文件占位）
    let filePath;
    try {
      filePath = uploadService.mergeChunks(req.userId, fileKey);
    } catch (_) {
      filePath = uploadService.getFilePath(req.userId, fileKey);
    }

    const file = await File.create({
      user_id: req.userId,
      filename: fileKey,
      original_name,
      file_type,
      file_size: file_size || 0,
      cos_key: filePath, // 兼容旧字段，实际存储本地路径
      upload_status: 'completed',
    });

    // 上传后自动创建待审核记录
    await ReviewRecord.create({ user_id: req.userId, file_id: file.id, status: 'pending' });

    res.json({ code: 0, message: '上传完成', data: { id: file.id } });
  } catch (err) {
    console.error('合并完成失败:', err);
    res.status(500).json({ code: 500, message: '上传完成处理失败' });
  }
}, logAction('upload_file', 'file'));

// 获取上传限额信息
router.get('/quota', requireAuth, async (req, res) => {
  const user = await User.findByPk(req.userId);
  const limit = MEMBER_LIMITS[user.member_level || 'free'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await File.count({
    where: { user_id: req.userId, created_at: { [Op.gte]: today } },
  });
  res.json({
    code: 0,
    data: {
      member_level: user.member_level,
      daily_limit: limit,
      today_used: todayCount,
      remaining: Math.max(0, limit - todayCount),
    },
  });
});

// 文件列表
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    const { rows, count } = await File.findAndCountAll({
      where: { user_id: req.userId },
      attributes: ['id', 'original_name', 'file_type', 'file_size', 'upload_status', 'page_count', 'is_scanned', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: parseInt(offset),
    });
    res.json({ code: 0, data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取文件列表失败' });
  }
});

// 文件详情
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const file = await File.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!file) return res.status(404).json({ code: 404, message: '文件不存在' });
    res.json({ code: 0, data: file.toJSON() });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取文件详情失败' });
  }
});

// 预览文件内容
router.get('/:id/preview', requireAuth, async (req, res) => {
  try {
    const file = await File.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!file) return res.status(404).json({ code: 404, message: '文件不存在' });

    if (file.text_content) {
      return res.json({
        code: 0,
        data: { text: file.text_content, page_count: file.page_count,
                is_scanned: file.is_scanned, file_type: file.file_type,
                original_name: file.original_name },
      });
    }

    const result = await parseService.parseFile(file);
    await file.update({
      text_content: result.text,
      page_count: result.pageCount,
      is_scanned: result.isScanned,
    });

    res.json({
      code: 0,
      data: { text: result.text, page_count: result.pageCount,
              is_scanned: result.isScanned, file_type: file.file_type,
              original_name: file.original_name },
    });
  } catch (err) {
    console.error('文件预览失败:', err);
    res.status(500).json({ code: 500, message: '文件预览解析失败' });
  }
});

// 删除文件
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const file = await File.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!file) return res.status(404).json({ code: 404, message: '文件不存在' });
    // 删除本地文件
    uploadService.deleteFile(req.userId, file.filename);
    await file.destroy();
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '删除失败' });
  }
}, logAction('delete_file', 'file'));

module.exports = router;
