# 智审文书 — 小程序 & App

专业文书合同智能审核系统，支持微信小程序和 Android/iOS 原生 App。

## 功能概述

- **文件上传**：支持 DOCX / PDF 格式
- **智能审核**：DeepSeek AI 全量分析，11项合同风险维度自动检测
- **风险检测**：覆盖违约条款、隐私合规、知识产权、管辖权等
- **审核报告**：自动生成结构化风险报告，支持 PDF 导出
- **会员体系**：多级会员 + 邀请返利
- **管理后台**：审核记录、用户管理、运营日志、推广统计

## 界面截图

### 小程序端

| 首页 | 审核结果 | 审核报告 | PDF报告 |
|------|----------|----------|--------|
| ![首页](截图/微信图片_20260512150932_40_15.jpg) | ![审核结果](截图/微信图片_20260512150934_42_15.jpg) | ![审核报告](截图/微信图片_20260512150931_38_15.jpg) | ![PDF报告](截图/微信图片_20260512150932_39_15.jpg) |

| 历史记录 | 个人中心 | 会员中心 | 邀请好友 |
|----------|----------|----------|----------|
| ![历史记录](截图/微信图片_20260512150945_43_15.jpg) | ![个人中心](截图/微信图片_20260512150933_41_15.jpg) | ![会员中心](截图/微信图片_20260512150930_37_15.jpg) | ![邀请好友](截图/微信图片_20260512150929_36_15.jpg) |

### 管理后台

| 审核记录 | 用户管理 | 推广统计 |
|----------|----------|----------|
| ![审核记录](截图/审核记录.png) | ![用户管理](截图/用户管理.png) | ![推广统计](截图/推广统计.png)|

## 技术栈

| 层 | 技术 |
|------|------|
| 前端 | uni-app (Vue 3) + Pinia + uni-ui |
| 后端 | Node.js + Express + Sequelize |
| 数据库 | MySQL + Redis |
| 文件存储 | 腾讯云 COS |
| 文档解析 | mammoth (DOCX) + pdf-parse + Tesseract.js (OCR) |
| AI | DeepSeek API（全量智能审核） |
| 管理后台 | Vue 3 + Element Plus + Vite |
| 报告生成 | PDFKit |

## 项目结构

```
├── miniprogram/      # 前端 (uni-app)
│   └── src/
│       ├── pages/          # 页面
│       │   ├── index/              # 首页
│       │   ├── upload/             # 文件上传
│       │   ├── review-result/      # 审核结果
│       │   ├── report/             # 审核报告
│       │   ├── history/            # 历史记录
│       │   ├── preview/            # 文件预览
│       │   ├── login/              # 登录
│       │   ├── user/               # 个人中心
│       │   ├── edit-profile/       # 编辑资料
│       │   ├── member/             # 会员中心
│       │   ├── invite/             # 邀请好友
│       │   ├── privacy/            # 隐私政策
│       │   └── user-agreement/     # 用户协议
│       ├── store/           # Pinia 状态管理
│       └── utils/           # 工具函数
├── server/           # 后端 (Express)
│   └── src/
│       ├── routes/          # 接口路由 (auth, files, review, report, marketing, admin)
│       ├── models/          # 数据模型 (User, File, ReviewRecord, InviteRecord, OperationLog)
│       ├── services/        # 业务服务 (AI, COS, 文档解析, 审核, 报告, 上传)
│       └── middleware/       # 中间件 (JWT 鉴权等)
├── admin/            # 管理后台 (Vue 3 + Element Plus)
│   └── src/
│       ├── views/           # 页面 (Dashboard, Reviews, Users, Marketing, Logs, Login)
│       ├── api/             # API 接口
│       ├── store/           # 状态管理
│       └── router/          # 路由
├── database/         # 数据库脚本
├── doc_review.sql    # 数据库初始化 SQL
└── nginx.conf        # Nginx 反向代理配置
```

## 快速开始

```bash
# 1. 导入数据库
mysql -u root -p < doc_review.sql

# 2. 启动后端 (默认端口 3000)
cd server && npm install && npm run dev

# 3. 启动管理后台 (默认端口 8080)
cd admin && npm install && npm run dev

# 4. 启动小程序开发
cd miniprogram && npm install && npm run dev:mp-weixin
```

## 管理后台登录

- 地址：`http://localhost:8080`
- 账号：`13800000000`
- 密码：`admin123`
