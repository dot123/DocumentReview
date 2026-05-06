const router = require('express').Router();
const { User } = require('../../models');
const { logAction } = require('../../middleware/logger');

// 用户列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, role, status, member_level } = req.query;
    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (member_level) where.member_level = member_level;

    const offset = (page - 1) * pageSize;
    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: ['id', 'nickname', 'phone', 'avatar_url', 'role', 'status', 'member_level', 'member_expire_at', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: parseInt(offset),
    });

    res.json({
      code: 0,
      data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) },
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取用户列表失败' });
  }
});

// 用户详情
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'nickname', 'phone', 'avatar_url', 'role', 'status', 'member_level', 'member_expire_at', 'inviter_id', 'created_at'],
    });
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    // 统计用户文件数和审核次数
    const { File, ReviewRecord } = require('../../models');
    const fileCount = await File.count({ where: { user_id: user.id } });
    const reviewCount = await ReviewRecord.count({ where: { user_id: user.id } });

    res.json({ code: 0, data: { ...user.toJSON(), file_count: fileCount, review_count: reviewCount } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取用户详情失败' });
  }
});

// 禁用/启用用户
router.put('/:id', async (req, res) => {
  try {
    const { status, role, member_level } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    if (status) user.status = status;
    if (role) user.role = role;
    if (member_level) user.member_level = member_level;
    await user.save();

    res.json({ code: 0, message: '用户更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '更新用户失败' });
  }
}, logAction('update_user', 'user'));

module.exports = router;
