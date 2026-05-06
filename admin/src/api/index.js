import request from './request';

export default {
  // 规则管理
  getRules(params) { return request.get('/admin/rules', { params }); },
  createRule(data) { return request.post('/admin/rules', data); },
  updateRule(id, data) { return request.put(`/admin/rules/${id}`, data); },
  deleteRule(id) { return request.delete(`/admin/rules/${id}`); },
  batchToggleRules(data) { return request.put('/admin/rules/batch/toggle', data); },

  // 用户管理
  getUsers(params) { return request.get('/admin/users', { params }); },
  getUserDetail(id) { return request.get(`/admin/users/${id}`); },
  updateUser(id, data) { return request.put(`/admin/users/${id}`, data); },

  // 审核记录
  getReviews(params) { return request.get('/admin/reviews', { params }); },
  getReviewDetail(id) { return request.get(`/admin/reviews/${id}`); },

  // 操作日志
  getLogs(params) { return request.get('/admin/logs', { params }); },
  getLogStats() { return request.get('/admin/logs/stats'); },

  // 统计数据
  getDashboard() { return request.get('/admin/stats/dashboard'); },

  // 推广数据
  getMarketingOverview() { return request.get('/marketing/admin-overview'); },
};
