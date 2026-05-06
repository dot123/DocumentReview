import { API_HOST } from '../config';

// 腾讯云COS上传工具
// 使用 cos-wx-sdk-v5 实现断点续传

// 注意：需要在项目中引入 cos-wx-sdk-v5
// import COS from 'cos-wx-sdk-v5';

let cosInstance = null;

// 初始化COS实例
function getCOSInstance() {
  // cos-wx-sdk-v5 需要获取临时密钥，此处为框架代码
  // 实际使用时需要从后端获取临时密钥并初始化
  return cosInstance;
}

// 分片上传（支持断点续传）
export function uploadFile(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const { fileName, fileType, onProgress } = options;

    // 1. 获取上传签名
    uni.request({
      url: API_HOST + '/api/files/cos-signature',
      method: 'POST',
      data: { filename: fileName, file_type: fileType },
      header: {
        'Authorization': `Bearer ${uni.getStorageSync('token')}`,
      },
      success(signRes) {
        if (signRes.data.code !== 0) {
          return reject(new Error(signRes.data.message));
        }

        const { authorization, cosKey, bucket, region, uploadUrl } = signRes.data.data;

        // 2. 使用微信API上传文件（大文件分片）
        // 注意：实际生产环境使用 cos-wx-sdk-v5 的 uploadFile 方法
        // 它内置了分片上传和断点续传能力
        const uploadTask = uni.uploadFile({
          url: uploadUrl,
          filePath: filePath,
          name: 'file',
          header: {
            'Authorization': authorization,
          },
          success(uploadRes) {
            if (uploadRes.statusCode === 200) {
              // 3. 通知后端上传完成
              uni.request({
                url: 'http://192.168.10.4:3000/api/files/complete',
                method: 'POST',
                data: {
                  cos_key: cosKey,
                  original_name: fileName,
                  file_type: fileType,
                  file_size: 0, // 由后端从COS获取
                },
                header: {
                  'Authorization': `Bearer ${uni.getStorageSync('token')}`,
                },
                success(completeRes) {
                  if (completeRes.data.code === 0) {
                    resolve({ fileId: completeRes.data.data.id, cosKey });
                  } else {
                    reject(new Error(completeRes.data.message));
                  }
                },
                fail: reject,
              });
            } else {
              reject(new Error('上传失败'));
            }
          },
          fail: reject,
        });

        // 上传进度回调
        if (onProgress && uploadTask) {
          uploadTask.onProgressUpdate((res) => {
            onProgress(res.progress);
          });
        }
      },
      fail: reject,
    });
  });
}

// 获取文件下载URL
export function getFileUrl(cosKey) {
  return `http://192.168.10.4:3000/api/files/${cosKey}/preview`;
}
