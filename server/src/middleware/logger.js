const { OperationLog } = require('../models');

const actionLabels = {
  login: '管理员登录',
  device_login: '设备登录',
  start_review: '提交文件审核',
  upload_file: '上传文件',
  delete_file: '删除文件',
  create_rule: '创建审核规则',
  update_rule: '更新审核规则',
  delete_rule: '删除审核规则',
  update_user: '更新用户信息',
  bind_phone: '绑定手机号',
};

function logAction(action, targetType) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode < 400) {
        const targetId = req.params.id || body?.data?.id || null;
        const detail = JSON.stringify({
          description: actionLabels[action] || action,
          method: req.method,
          path: req.originalUrl,
          target_id: targetId,
        });
        OperationLog.create({
          user_id: req.userId || 0,
          action,
          target_type: targetType,
          target_id: targetId,
          detail,
          ip: req.ip || req.connection?.remoteAddress || '',
        }).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { logAction };
