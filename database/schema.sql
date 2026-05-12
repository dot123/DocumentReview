-- 文书审核微信小程序 数据库初始化脚本
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS doc_review DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE doc_review;

-- 用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(128) NOT NULL UNIQUE COMMENT '微信openid或设备标识',
  unionid VARCHAR(64) DEFAULT NULL COMMENT '微信unionid',
  device_id VARCHAR(128) DEFAULT NULL COMMENT 'App设备唯一标识',
  phone VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  nickname VARCHAR(64) DEFAULT '用户' COMMENT '昵称',
  avatar_url TEXT DEFAULT NULL COMMENT '头像(base64)',
  role ENUM('user','admin') NOT NULL DEFAULT 'user' COMMENT '角色',
  status ENUM('active','disabled') NOT NULL DEFAULT 'active' COMMENT '状态',
  member_level ENUM('free','vip','svip') NOT NULL DEFAULT 'free' COMMENT '会员等级',
  member_expire_at DATETIME DEFAULT NULL COMMENT '会员过期时间',
  inviter_id INT DEFAULT NULL COMMENT '邀请人ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_openid (openid),
  INDEX idx_phone (phone),
  INDEX idx_inviter (inviter_id),
  INDEX idx_device (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 文件表
CREATE TABLE files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '上传用户ID',
  filename VARCHAR(255) NOT NULL COMMENT '存储文件名',
  original_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
  file_type ENUM('docx','pdf') NOT NULL COMMENT '文件类型',
  file_size BIGINT NOT NULL DEFAULT 0 COMMENT '文件大小(字节)',
  cos_key VARCHAR(500) NOT NULL COMMENT 'COS存储Key',
  cos_url VARCHAR(1000) DEFAULT NULL COMMENT 'COS访问URL',
  upload_status ENUM('uploading','completed','failed') NOT NULL DEFAULT 'uploading' COMMENT '上传状态',
  text_content LONGTEXT DEFAULT NULL COMMENT '提取的文本内容',
  page_count INT DEFAULT 0 COMMENT '页数',
  is_scanned TINYINT(1) DEFAULT 0 COMMENT '是否扫描版PDF',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_upload_status (upload_status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件表';

-- 审核记录表
CREATE TABLE review_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  file_id INT NOT NULL COMMENT '文件ID',
  status ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending' COMMENT '审核状态',
  results JSON DEFAULT NULL COMMENT '审核结果明细',
  risk_summary JSON DEFAULT NULL COMMENT '风险摘要统计',
  report_cos_key VARCHAR(500) DEFAULT NULL COMMENT '报告COS Key',
  report_cos_url VARCHAR(1000) DEFAULT NULL COMMENT '报告访问URL',
  duration INT DEFAULT 0 COMMENT '审核耗时(秒)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_file (file_id),
  INDEX idx_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核记录表';

-- 操作日志表
CREATE TABLE operation_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT DEFAULT NULL COMMENT '操作用户ID(0=系统)',
  action VARCHAR(50) NOT NULL COMMENT '操作类型',
  target_type VARCHAR(50) DEFAULT NULL COMMENT '操作对象类型',
  target_id INT DEFAULT NULL COMMENT '操作对象ID',
  detail TEXT COMMENT '操作详情JSON',
  ip VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 邀请记录表
CREATE TABLE invite_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  inviter_id INT NOT NULL COMMENT '邀请人ID',
  invitee_id INT NOT NULL COMMENT '被邀请人ID',
  reward_type VARCHAR(30) DEFAULT NULL COMMENT '奖励类型',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_inviter (inviter_id),
  FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邀请记录表';

-- 初始化默认管理员账号（openid需后续替换为真实管理员openid）
INSERT INTO `users` (`id`, `openid`, `unionid`, `phone`, `nickname`, `avatar_url`, `role`, `status`, `member_level`) VALUES (1, 'admin_openid_placeholder', NULL, '13800000000', '系统管理员', NULL, 'admin', 'active', 'free');

