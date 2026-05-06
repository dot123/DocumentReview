import request from '../utils/request';

export default {
  login(code) {
    return request.post('/auth/login', { code });
  },
  bindPhone(code) {
    return request.post('/auth/phone', { code });
  },
  getProfile() {
    return request.get('/auth/profile');
  },
  updateProfile(data) {
    return request.put('/auth/profile', data);
  },
  // 邀请
  getInviteCode() {
    return request.get('/marketing/invite-code');
  },
  bindInvite(code) {
    return request.post('/marketing/invite', { invite_code: code });
  },
  getInviteStats() {
    return request.get('/marketing/stats');
  },
};
