import request from '../utils/request';

export default {
  // 获取COS上传签名
  getCosSignature(data) {
    return request.post('/files/cos-signature', data);
  },
  // 上传完成通知
  uploadComplete(data) {
    return request.post('/files/complete', data);
  },
  // 文件列表
  getList(params) {
    return request.get('/files', params);
  },
  // 文件详情
  getDetail(id) {
    return request.get(`/files/${id}`);
  },
  // 预览文件内容
  getPreview(id) {
    return request.get(`/files/${id}/preview`);
  },
  // 删除文件
  deleteFile(id) {
    return request.delete(`/files/${id}`);
  },
};
