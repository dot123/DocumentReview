const router = require('express').Router();
const { OperationLog, User } = require('../../models');
const { Op } = require('sequelize');

// 操作日志列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 50, action, startDate, endDate, userId } = req.query;
    const where = {};

    if (action) where.action = action;
    if (userId) where.user_id = userId;
    if (startDate && endDate) {
      where.created_at = { [Op.between]: [startDate, endDate] };
    }

    const offset = (page - 1) * pageSize;
    const { rows, count } = await OperationLog.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'nickname'], required: false }],
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: parseInt(offset),
    });

    res.json({
      code: 0,
      data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) },
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取操作日志失败' });
  }
});

// 操作日志统计
router.get('/stats', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { sequelize } = require('../../config/db');

    // 最近7天每天操作量
    const dailyStats = await OperationLog.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', '*'), 'count'],
      ],
      where: {
        created_at: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
    });

    // 操作类型分布
    const actionStats = await OperationLog.findAll({
      attributes: [
        'action',
        [sequelize.fn('COUNT', '*'), 'count'],
      ],
      group: ['action'],
      order: [[sequelize.fn('COUNT', '*'), 'DESC']],
    });

    res.json({
      code: 0,
      data: { daily: dailyStats, actions: actionStats },
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取日志统计失败' });
  }
});

OperationLog.belongsTo(User, { foreignKey: 'user_id', constraints: false });

module.exports = router;
