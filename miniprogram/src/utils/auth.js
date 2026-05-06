// 日期格式化
export function formatDate(val) {
  if (!val) return '';
  const d = new Date(val);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// 微信登录（仅小程序）
export function wxLogin() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success(res) {
        resolve(res.code);
      },
      fail(err) {
        reject(err);
      },
    });
  });
}

// 设备登录（Android/iOS原生App）
export function deviceLogin() {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    const deviceId = plus.device.uuid;
    resolve(deviceId);
    // #endif
    // #ifndef APP-PLUS
    reject(new Error('非App平台'));
    // #endif
  });
}

// 获取手机号
export function getPhoneNumber(e) {
  return new Promise((resolve, reject) => {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      return reject(new Error('取消授权'));
    }
    resolve(e.detail.code);
  });
}

// 检查登录状态
export function checkLogin() {
  const token = uni.getStorageSync('token');
  const userInfo = uni.getStorageSync('userInfo');
  return token && userInfo;
}

// 退出登录
export function logout() {
  uni.removeStorageSync('token');
  uni.removeStorageSync('userInfo');
  uni.reLaunch({ url: '/pages/login/login' });
}
