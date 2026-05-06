const router = require('express').Router();
const jwt = require('jsonwebtoken');
const config = require('../../config');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { User, OperationLog } = require('../../models');
const { getRedis } = require('../../config/db');
const rulesRouter = require('./rules');
const usersRouter = require('./users');
const reviewsRouter = require('./reviews');
const logsRouter = require('./logs');
const statsRouter = require('./stats');

// 管理员登录（用户名密码方式，供Web后台使用）
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '请输入用户名和密码' });
    }

    // 查找管理员用户
    const user = await User.findOne({
      where: { phone: username, role: 'admin', status: 'active' },
    });

    if (!user) {
      return res.status(401).json({ code: 401, message: '账号或密码错误' });
    }

    // 简化处理：演示阶段密码为admin123
    // 生产环境应使用bcrypt加密比对
    if (password !== 'admin123') {
      return res.status(401).json({ code: 401, message: '账号或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: '12h' }
    );

    const redis = await getRedis();
    if (redis) {
      await redis.setEx(`token:${user.id}`, 43200, token);
    }

    await OperationLog.create({
      user_id: user.id, action: 'login', target_type: 'admin',
      target_id: user.id, ip: req.ip,
    }).catch(() => {});

    res.json({
      code: 0,
      message: '登录成功',
      data: { token, user: { id: user.id, nickname: user.nickname, role: user.role } },
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '登录失败' });
  }
});

// 所有管理接口都需要登录+管理员权限
router.use(requireAuth, requireAdmin);
router.use('/rules', rulesRouter);
router.use('/users', usersRouter);
router.use('/reviews', reviewsRouter);
router.use('/logs', logsRouter);
router.use('/stats', statsRouter);

module.exports = router;
