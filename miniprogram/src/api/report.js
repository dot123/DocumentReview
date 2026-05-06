import request from '../utils/request';

export default {
  // 获取报告数据
  getReport(recordId) {
    return request.get(`/report/${recordId}`);
  },
  // 导出PDF
  exportPdf(recordId) {
    return request.get(`/report/${recordId}/export`);
  },
};
