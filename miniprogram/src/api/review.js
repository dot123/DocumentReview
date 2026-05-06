import request from '../utils/request';

export default {
  // 开始审核
  startReview(fileId) {
    return request.post(`/review/${fileId}`);
  },
  // 获取审核结果
  getResult(recordId) {
    return request.get(`/review/${recordId}`);
  },
  // 审核记录列表
  getRecords(params) {
    return request.get('/review', params);
  },
};
