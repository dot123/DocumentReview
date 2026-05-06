const router = require('express').Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { getRedis } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { logAction } = require('../middleware/logger');
const { User, OperationLog } = require('../models');

// App(Android/iOS)设备登录
router.post('/device-login', async (req, res) => {
  try {
    const { deviceId, nickname } = req.body;
    if (!deviceId) {
      return res.status(400).json({ code: 400, message: '缺少设备标识' });
    }

    let user = await User.findOne({ where: { device_id: deviceId } });
    if (!user) {
      user = await User.create({
        device_id: deviceId,
        nickname: nickname || `用户${Date.now().toString(36).slice(-6)}`,
        openid: `device_${deviceId}`,
      });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ code: 403, message: '账号已被禁用' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const redis = await getRedis();
    if (redis) {
      await redis.setEx(`token:${user.id}`, 86400, token);
    }

    await OperationLog.create({
      user_id: user.id,
      action: 'device_login',
      target_type: 'user',
      target_id: user.id,
      ip: req.ip,
    }).catch(() => {});

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          phone: user.phone,
          role: user.role,
          member_level: user.member_level,
        },
      },
    });
  } catch (err) {
    console.error('设备登录失败:', err);
    res.status(500).json({ code: 500, message: '登录服务异常' });
  }
});

// 微信登录
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ code: 400, message: '缺少登录凭证code' });
    }

    // 调用微信接口换取openid
    const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: config.wx.appId,
        secret: config.wx.appSecret,
        js_code: code,
        grant_type: 'authorization_code',
      },
    });

    const { openid, session_key, unionid, errcode, errmsg } = wxRes.data;
    if (errcode) {
      return res.status(400).json({ code: 400, message: `微信登录失败: ${errmsg}` });
    }

    // 查找或创建用户
    let user = await User.findOne({ where: { openid } });
    if (!user) {
      user = await User.create({ openid, unionid: unionid || null });
    }

    // 检查账号是否被禁用
    if (user.status === 'disabled') {
      return res.status(403).json({ code: 403, message: '账号已被禁用' });
    }

    // 生成JWT Token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    // 缓存Token到Redis
    const redis = await getRedis();
    if (redis) {
      await redis.setEx(`token:${user.id}`, 86400, token);
    }

    // 记录日志
    await OperationLog.create({
      user_id: user.id,
      action: 'login',
      target_type: 'user',
      target_id: user.id,
      ip: req.ip,
    }).catch(() => {});

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          phone: user.phone,
          role: user.role,
          member_level: user.member_level,
        },
      },
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ code: 500, message: '登录服务异常' });
  }
});

// 手机号绑定
router.post('/phone', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ code: 400, message: '缺少手机号授权code' });
    }

    // 获取access_token
    const tokenRes = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        appid: config.wx.appId,
        secret: config.wx.appSecret,
        grant_type: 'client_credential',
      },
    });
    const accessToken = tokenRes.data.access_token;

    // 获取手机号
    const phoneRes = await axios.post(
      `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
      { code }
    );
    const { phone_info } = phoneRes.data;
    if (!phone_info || !phone_info.purePhoneNumber) {
      return res.status(400).json({ code: 400, message: '获取手机号失败' });
    }

    // 检查手机号是否已被其他用户绑定
    const existUser = await User.findOne({ where: { phone: phone_info.purePhoneNumber } });
    if (existUser && existUser.id !== req.userId) {
      return res.status(400).json({ code: 400, message: '该手机号已被其他账号绑定' });
    }

    await User.update(
      { phone: phone_info.purePhoneNumber },
      { where: { id: req.userId } }
    );

    res.json({ code: 0, message: '手机号绑定成功' });
  } catch (err) {
    console.error('手机号绑定失败:', err);
    res.status(500).json({ code: 500, message: '手机号绑定失败' });
  }
}, logAction('bind_phone', 'user'));

// 获取用户信息
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'nickname', 'avatar_url', 'phone', 'role', 'member_level', 'member_expire_at', 'status', 'created_at'],
    });
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    res.json({ code: 0, data: user });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取用户信息失败' });
  }
});

// 更新用户信息
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { nickname, avatar_url } = req.body;
    await User.update(
      { nickname, avatar_url },
      { where: { id: req.userId } }
    );
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '更新失败' });
  }
});

module.exports = router;

// 上传头像
const uploadAvatar = multer({ storage: multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/avatars');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${req.userId}_${Date.now()}${path.extname(file.originalname)}`),
})});

router.post('/avatar', requireAuth, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    console.log('[头像上传] userId:', req.userId);
    console.log('[头像上传] has file:', !!req.file, 'has base64:', !!req.body.data_base64);
    if (req.body.data_base64) console.log('[头像上传] base64长度:', req.body.data_base64.length);

    let base64;
    if (req.body.data_base64) {
      base64 = req.body.data_base64.startsWith('data:') ? req.body.data_base64 : `data:image/jpeg;base64,${req.body.data_base64}`;
      console.log('[头像上传] 使用base64方式');
    } else if (req.file) {
      console.log('[头像上传] 使用文件方式, path:', req.file.path);
      const buf = fs.readFileSync(req.file.path);
      const ext = path.extname(req.file.filename).replace('.', '');
      base64 = `data:image/${ext};base64,${buf.toString('base64')}`;
      fs.unlinkSync(req.file.path);
    } else {
      console.log('[头像上传] 无数据');
      return res.status(400).json({ code: 400, message: '请选择头像' });
    }
    console.log('[头像上传] 保存base64长度:', base64.length);
    await User.update({ avatar_url: base64 }, { where: { id: req.userId } });
    console.log('[头像上传] 保存成功');
    res.json({ code: 0, data: { avatar_url: base64 } });
  } catch (err) {
    console.error('[头像上传] 失败:', err.message);
    console.error('[头像上传] 堆栈:', err.stack);
    res.status(500).json({ code: 500, message: '上传失败' });
  }
});
