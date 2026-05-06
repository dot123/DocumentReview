const router = require('express').Router();
const { ReviewRecord, File, User } = require('../../models');
const { Op } = require('sequelize');

// 审核记录列表（全量）
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, keyword, startDate, endDate } = req.query;
    const where = {};

    if (status) where.status = status;
    if (startDate && endDate) {
      where.created_at = { [Op.between]: [startDate, endDate] };
    }

    const offset = (page - 1) * pageSize;
    const { rows, count } = await ReviewRecord.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'nickname', 'phone'] },
        { model: File, as: 'file', attributes: ['id', 'original_name', 'file_type', 'file_size'] },
      ],
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

// 审核详情
router.get('/:id', async (req, res) => {
  try {
    const record = await ReviewRecord.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'nickname', 'phone'] },
        { model: File, as: 'file' },
      ],
    });
    if (!record) {
      return res.status(404).json({ code: 404, message: '审核记录不存在' });
    }
    res.json({ code: 0, data: record });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取审核详情失败' });
  }
});

module.exports = router;
