const jwt = require('jsonwebtoken');
const config = require('../config');
const { getRedis } = require('../config/db');
const { User } = require('../models');

// 必需登录
async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }
    const decoded = jwt.verify(token, config.jwtSecret);
    // 检查Redis中token是否有效（Redis不可用时跳过）
    const redis = await getRedis();
    if (redis) {
      const cached = await redis.get(`token:${decoded.userId}`).catch(() => null);
      if (cached && cached !== token) {
        return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
      }
    }
    // 检查用户是否被禁用
    const user = await User.findByPk(decoded.userId, { attributes: ['status'] });
    if (!user || user.status === 'disabled') {
      return res.status(401).json({ code: 401, message: '账号已被禁用，请联系管理员' });
    }
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
}

// 管理员权限
function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ code: 403, message: '无管理员权限' });
  }
  next();
}

// 可选登录(未登录也能访问)
async function optionalAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    }
  } catch (_) { /* ignore */ }
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
