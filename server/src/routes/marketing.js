const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { User, InviteRecord, File, ReviewRecord } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

// 获取用户邀请码（使用用户ID的编码）
router.get('/invite-code', requireAuth, async (req, res) => {
  const code = Buffer.from(`uid:${req.userId}`).toString('base64');
  res.json({ code: 0, data: { invite_code: code } });
});

// 通过邀请码绑定邀请关系
router.post('/invite', requireAuth, async (req, res) => {
  try {
    const { invite_code } = req.body;
    if (!invite_code) {
      return res.status(400).json({ code: 400, message: '缺少邀请码' });
    }

    // 解码邀请码
    let inviterId;
    try {
      const decoded = Buffer.from(invite_code, 'base64').toString('utf8');
      inviterId = parseInt(decoded.replace('uid:', ''));
    } catch (_) {
      return res.status(400).json({ code: 400, message: '无效的邀请码' });
    }

    if (inviterId === req.userId) {
      return res.status(400).json({ code: 400, message: '不能邀请自己' });
    }

    // 检查邀请人是否存在
    const inviter = await User.findByPk(inviterId);
    if (!inviter) {
      return res.status(400).json({ code: 400, message: '邀请码无效' });
    }

    // 检查是否已被邀请过
    const existingInvite = await InviteRecord.findOne({ where: { invitee_id: req.userId } });
    if (existingInvite) {
      return res.status(400).json({ code: 400, message: '您已被其他用户邀请' });
    }

    const user = await User.findByPk(req.userId);
    if (user.inviter_id) {
      return res.status(400).json({ code: 400, message: '已绑定邀请关系' });
    }

    // 创建邀请记录
    await InviteRecord.create({
      inviter_id: inviterId,
      invitee_id: req.userId,
      reward_type: 'invite_bonus',
    });

    // 更新用户邀请人
    await user.update({ inviter_id: inviterId });

    // 邀请奖励：邀请人获得VIP体验（简化逻辑）
    await inviter.update({
      member_level: inviter.member_level === 'free' ? 'vip' : inviter.member_level,
      member_expire_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天
    });

    res.json({ code: 0, message: '邀请绑定成功' });
  } catch (err) {
    console.error('邀请绑定失败:', err);
    res.status(500).json({ code: 500, message: '邀请绑定失败' });
  }
});

// 我的邀请统计
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const inviteCount = await InviteRecord.count({ where: { inviter_id: req.userId } });
    const invitees = await InviteRecord.findAll({
      where: { inviter_id: req.userId },
      include: [{ model: User, as: 'invitee', attributes: ['id', 'nickname', 'created_at'] }],
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    // 获取当前用户的会员信息
    const user = await User.findByPk(req.userId, {
      attributes: ['member_level', 'member_expire_at'],
    });

    res.json({
      code: 0,
      data: {
        invite_count: inviteCount,
        member_level: user.member_level,
        member_expire_at: user.member_expire_at,
        invitees,
      },
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取邀请统计失败' });
  }
});

// 管理后台：推广总览（需要admin权限，在admin路由中使用）
router.get('/admin-overview', requireAuth, async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ code: 403, message: '无权限' });
  }

  try {
    // 总邀请数据
    const totalInvites = await InviteRecord.count();
    const topInviters = await InviteRecord.findAll({
      attributes: [
        'inviter_id',
        [sequelize.fn('COUNT', '*'), 'invite_count'],
      ],
      include: [{ model: User, as: 'inviter', attributes: ['id', 'nickname', 'phone'] }],
      group: ['inviter_id'],
      order: [[sequelize.fn('COUNT', '*'), 'DESC']],
      limit: 20,
    });

    // 会员分布
    const memberStats = await User.findAll({
      attributes: [
        'member_level',
        [sequelize.fn('COUNT', '*'), 'count'],
      ],
      group: ['member_level'],
    });

    res.json({
      code: 0,
      data: {
        totalInvites,
        topInviters,
        memberStats,
      },
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取推广数据失败' });
  }
});

module.exports = router;
