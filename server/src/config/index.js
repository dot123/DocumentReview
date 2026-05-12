module.exports = {
  // 服务端口
  port: process.env.PORT || 3000,

  // JWT密钥
  jwtSecret: process.env.JWT_SECRET || 'doc-review-jwt-secret-change-in-production',
  jwtExpiresIn: '24h',

  // 微信小程序配置
  wx: {
    appId: process.env.WX_APPID || 'wx3d71c59bf03a9f41',
    appSecret: process.env.WX_APPSECRET || 'bf51df3d453d87a82d113984c9e3541d',
  },

  // 文件上传配置
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSize: 100 * 1024 * 1024, // 100MB
  },

  // 数据库配置
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'doc_review',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'qsp123456',
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },

  // AI服务配置（OpenAI兼容接口）
  // 填入API Key即启用，留空则仅使用内置规则库审核
  // 推荐DeepSeek: https://platform.deepseek.com 申请API Key，极低价
  ai: {
    apiKey: '',  // 填入你的API Key
    apiEndpoint: 'https://api.longcat.chat/openai',
    model: 'LongCat-Flash-Chat',
  },
};
