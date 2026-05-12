const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const { sequelize } = require('./config/db');

// 路由
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const reviewRoutes = require('./routes/review');
const reportRoutes = require('./routes/report');
const adminRoutes = require('./routes/admin');
const marketingRoutes = require('./routes/marketing');

const app = express();

// 安全与解析中间件
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(':method :url → :status :response-time[0]ms'));

// 请求详情日志（调试用）
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const icon = res.statusCode < 400 ? '✓' : '✗';
    console.log(`  ${icon} [${res.statusCode}] ${req.method} ${req.originalUrl} (${ms}ms)`);
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        const body = JSON.stringify(req.body);
        if (body && body !== '{}') console.log(`    body: ${body.substring(0, 200)}`);
      } catch (_) { }
    }
  });
  next();
});

// 路由注册
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/marketing', marketingRoutes);

// 静态文件 - 头像
app.use('/uploads', express.static('uploads'));

// 管理后台静态文件（生产环境：server 直接托管 admin 构建产物）
const adminDist = path.join(__dirname, '../../admin/dist');
app.use(express.static(adminDist));
// SPA fallback: 非 /api 路径都返回 admin/index.html
app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => {
  res.sendFile(path.join(adminDist, 'index.html'));
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 全局错误处理
app.use((err, req, res, _next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误',
  });
});

// 确保默认管理员账号存在
async function seedAdmin() {
  const { User } = require('./models');
  const [admin, created] = await User.findOrCreate({
    where: { phone: '13800000000', role: 'admin' },
    defaults: {
      openid: 'admin_openid_placeholder',
      phone: '13800000000',
      nickname: '系统管理员',
      role: 'admin',
      status: 'active',
      member_level: 'free',
    },
  });
  if (created) {
    console.log('已创建默认管理员账号: 13800000000 / admin123');
  } else {
    // 确保openid存在（已有的admin可能openid为空）
    if (!admin.openid) {
      await admin.update({ openid: 'admin_openid_placeholder' });
    }
  }
}

// 启动服务
async function start() {
  try {
    await sequelize.authenticate();
    console.log('MySQL连接成功');
    await sequelize.sync({ alter: true });
    console.log('数据表同步完成');
    await seedAdmin();
    app.listen(config.port, () => {
      console.log(`服务已启动: http://0.0.0.0:${config.port}`);
    });
  } catch (err) {
    console.error('启动失败:', err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
