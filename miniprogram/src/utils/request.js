import { API_BASE } from '../config';

function request(options) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token');
    const url = API_BASE + options.url;
    const method = options.method || 'GET';

    console.log(`>>> ${method} ${url}`);
    if (options.data && Object.keys(options.data).length > 0) {
      console.log(`    data:`, JSON.stringify(options.data));
    }

    uni.request({
      url,
      method,
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header,
      },
      success(res) {
        console.log(`<<< ${method} ${options.url} → ${res.statusCode}`, res.data);
        if (res.statusCode === 401) {
          uni.removeStorageSync('token');
          uni.removeStorageSync('userInfo');
          uni.reLaunch({ url: '/pages/login/login' });
          return reject(new Error('登录已过期'));
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          console.warn(`    ✗ 请求失败:`, res.data);
          uni.showToast({ title: res.data?.message || '请求失败', icon: 'none' });
          reject(res.data);
        }
      },
      fail(err) {
        console.error(`    ✗ 网络错误:`, err);
        reject(err);
      },
    });
  });
}

export default {
  get: (url, data) => request({ url, method: 'GET', data }),
  post: (url, data) => request({ url, method: 'POST', data }),
  put: (url, data) => request({ url, method: 'PUT', data }),
  delete: (url, data) => request({ url, method: 'DELETE', data }),
};
