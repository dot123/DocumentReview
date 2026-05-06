const { OperationLog } = require('../models');

function logAction(action, targetType) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      // 仅记录成功操作
      if (res.statusCode < 400) {
        OperationLog.create({
          user_id: req.userId || 0,
          action,
          target_type: targetType,
          target_id: req.params.id || body?.data?.id || null,
          detail: JSON.stringify({ method: req.method, path: req.originalUrl }),
          ip: req.ip || req.connection?.remoteAddress || '',
        }).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { logAction };
