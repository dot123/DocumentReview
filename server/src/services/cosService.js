const COS = require('cos-nodejs-sdk-v5');
const config = require('../config');

const cos = new COS({
  SecretId: config.cos.SecretId,
  SecretKey: config.cos.SecretKey,
});

// 生成临时上传签名（供前端直传COS）
function getUploadSignature(fileKey, userId) {
  const key = `files/${userId}/${fileKey}`;
  const authorization = cos.getAuth({
    Method: 'PUT',
    Key: key,
    Expires: 3600, // 1小时有效
  });
  return { authorization, key, bucket: config.cos.Bucket, region: config.cos.Region };
}

// 生成临时下载URL（有效期1小时）
function getDownloadUrl(cosKey, expires = 3600) {
  return cos.getObjectUrl({
    Bucket: config.cos.Bucket,
    Region: config.cos.Region,
    Key: cosKey,
    Sign: true,
    Expires: expires,
  });
}

// 获取COS上传所需的临时密钥（使用STS）
// 小程序端使用cos-wx-sdk-v5需要临时密钥
async function getTempCredentials(userId, fileKey) {
  // 在生产环境中，应使用STS服务获取临时密钥
  // 此处返回简单的签名信息供demo使用
  const key = `files/${userId}/${fileKey}`;
  const auth = cos.getAuth({
    Method: 'PUT',
    Key: key,
    Expires: 3600,
  });

  return {
    authorization: auth,
    cosKey: key,
    bucket: config.cos.Bucket,
    region: config.cos.Region,
    // 返回上传URL
    uploadUrl: `https://${config.cos.Bucket}.cos.${config.cos.Region}.myqcloud.com/${key}`,
  };
}

// 上传文件到COS（服务端上传，用于报告等）
function uploadToCos(key, body, contentType) {
  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: config.cos.Bucket,
      Region: config.cos.Region,
      Key: key,
      Body: body,
      ContentType: contentType,
    }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// 从COS下载文件内容
function downloadFromCos(key) {
  return new Promise((resolve, reject) => {
    cos.getObject({
      Bucket: config.cos.Bucket,
      Region: config.cos.Region,
      Key: key,
    }, (err, data) => {
      if (err) reject(err);
      else resolve(data.Body);
    });
  });
}

// 删除COS文件
function deleteFromCos(key) {
  return new Promise((resolve, reject) => {
    cos.deleteObject({
      Bucket: config.cos.Bucket,
      Region: config.cos.Region,
      Key: key,
    }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

module.exports = {
  getUploadSignature,
  getDownloadUrl,
  getTempCredentials,
  uploadToCos,
  downloadFromCos,
  deleteFromCos,
};
