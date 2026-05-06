const fs = require('fs');
const path = require('path');
const config = require('../config');

const uploadDir = path.resolve(config.upload.dir);

// 确保上传目录存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 获取用户上传目录
function getUserDir(userId) {
  const dir = path.join(uploadDir, String(userId));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// 初始化分片上传
function initChunkUpload(userId, fileKey, totalChunks) {
  const dir = getUserDir(userId);
  const chunkDir = path.join(dir, `${fileKey}_chunks`);
  if (!fs.existsSync(chunkDir)) {
    fs.mkdirSync(chunkDir, { recursive: true });
  }
  // 写入元数据
  fs.writeFileSync(path.join(chunkDir, 'meta.json'), JSON.stringify({ totalChunks, fileKey }));
  return { chunkDir, fileKey };
}

// 保存分片
function saveChunk(userId, fileKey, chunkIndex, buffer) {
  const dir = getUserDir(userId);
  const chunkDir = path.join(dir, `${fileKey}_chunks`);
  const chunkPath = path.join(chunkDir, `chunk_${chunkIndex}`);
  fs.writeFileSync(chunkPath, buffer);
  return chunkPath;
}

// 合并分片
function mergeChunks(userId, fileKey) {
  const dir = getUserDir(userId);
  const chunkDir = path.join(dir, `${fileKey}_chunks`);
  const meta = JSON.parse(fs.readFileSync(path.join(chunkDir, 'meta.json'), 'utf8'));
  const filePath = path.join(dir, fileKey);
  const writeStream = fs.createWriteStream(filePath);

  for (let i = 0; i < meta.totalChunks; i++) {
    const chunkPath = path.join(chunkDir, `chunk_${i}`);
    if (fs.existsSync(chunkPath)) {
      writeStream.write(fs.readFileSync(chunkPath));
    }
  }
  writeStream.end();

  // 清理分片
  fs.rmSync(chunkDir, { recursive: true, force: true });
  return filePath;
}

// 获取文件路径
function getFilePath(userId, filename) {
  return path.join(getUserDir(userId), filename);
}

// 读取文件内容
function readFile(userId, filename) {
  const filePath = getFilePath(userId, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error('文件不存在');
  }
  return fs.readFileSync(filePath);
}

// 删除文件
function deleteFile(userId, filename) {
  const filePath = getFilePath(userId, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

module.exports = {
  initChunkUpload,
  saveChunk,
  mergeChunks,
  getFilePath,
  readFile,
  deleteFile,
};
