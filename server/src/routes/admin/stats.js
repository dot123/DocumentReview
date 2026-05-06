const router = require('express').Router();
const { User, File, ReviewRecord, OperationLog } = require('../../models');
const { Op, fn, col } = require('sequelize');
const { sequelize } = require('../../config/db');

// 仪表盘统计数据
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalFiles,
      totalReviews,
      todayReviews,
      activeUsersToday,
    ] = await Promise.all([
      User.count(),
      File.count(),
      ReviewRecord.count(),
      ReviewRecord.count({
        where: { created_at: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      OperationLog.count({
        where: {
          created_at: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) },
          action: 'login',
        },
        distinct: true,
        col: 'user_id',
      }),
    ]);

    // 最近7天审核趋势
    const reviewTrend = await ReviewRecord.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', '*'), 'count'],
      ],
      where: {
        created_at: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
    });

    // 风险等级分布
    const riskDistribution = { high: 0, medium: 0, low: 0 };
    const allRecords = await ReviewRecord.findAll({
      where: { status: 'completed' },
      attributes: ['risk_summary'],
    });
    allRecords.forEach(r => {
      const summary = r.risk_summary || {};
      riskDistribution.high += summary.high || 0;
      riskDistribution.medium += summary.medium || 0;
      riskDistribution.low += summary.low || 0;
    });

    // 会员分布
    const memberDistribution = await User.findAll({
      attributes: ['member_level', [fn('COUNT', '*'), 'count']],
      group: ['member_level'],
    });

    res.json({
      code: 0,
      data: {
        overview: {
          totalUsers,
          totalFiles,
          totalReviews,
          todayReviews,
          activeUsersToday,
        },
        reviewTrend,
        riskDistribution,
        memberDistribution,
      },
    });
  } catch (err) {
    console.error('获取统计数据失败:', err);
    res.status(500).json({ code: 500, message: '获取统计数据失败' });
  }
});

module.exports = router;
