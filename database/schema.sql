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

-- 审核规则表
CREATE TABLE review_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '规则名称',
  category VARCHAR(50) NOT NULL DEFAULT '通用' COMMENT '规则分类',
  rule_type ENUM('keyword','regex','condition') NOT NULL DEFAULT 'keyword' COMMENT '规则类型',
  keywords JSON DEFAULT NULL COMMENT '关键词列表(keyword/condition类型)',
  pattern VARCHAR(500) DEFAULT NULL COMMENT '正则表达式(regex类型)',
  risk_level ENUM('high','medium','low') NOT NULL DEFAULT 'medium' COMMENT '风险等级',
  description TEXT COMMENT '规则说明',
  suggestion TEXT COMMENT '修改建议',
  is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核规则表';

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

-- 初始化默认审核规则
INSERT INTO review_rules (name, category, rule_type, keywords, risk_level, description, suggestion) VALUES
('违约条款缺失', '合同完整性', 'keyword', '["违约责任","违约方","违约金"]', 'high', '合同中未提及违约责任相关条款', '建议在合同中明确违约责任条款，包括违约金计算标准、赔偿范围等'),
('个人信息泄露风险', '隐私合规', 'keyword', '["身份证号","手机号","银行卡号","家庭地址"]', 'high', '文书中包含个人敏感信息，存在隐私泄露风险', '建议对个人敏感信息进行脱敏处理，或添加隐私保护条款'),
('模糊表述条款', '条款明确性', 'keyword', '["合理期限","适当补偿","酌情处理","视情况而定"]', 'medium', '文书中存在模糊、不确定的表述，可能导致争议', '建议将模糊表述替换为明确的时间、金额或标准'),
('管辖权不明', '法律适用', 'keyword', '["管辖法院","仲裁","争议解决"]', 'medium', '未明确约定争议解决方式和管辖机构', '建议明确约定争议解决方式（诉讼或仲裁）及具体管辖法院/仲裁机构'),
('保密条款缺失', '合同完整性', 'keyword', '["保密义务","商业秘密","保密期限"]', 'medium', '合同中未包含保密条款', '建议添加保密条款，明确保密信息范围、保密期限及违约责任'),
('知识产权归属不清', '知识产权', 'keyword', '["知识产权","著作权","专利权","商标权"]', 'high', '未明确知识产权归属，存在侵权风险', '建议明确约定知识产权的归属、使用范围和授权方式'),
('不可抗力条款缺失', '合同完整性', 'condition', '["不可抗力","天灾人祸","自然灾害","政府行为"]', 'low', '缺少不可抗力条款，突发事件下双方权益无法保障', '建议添加不可抗力条款，明确范围、通知义务和责任豁免'),
('金额大小写校验', '财务规范', 'regex', NULL, 'medium', '合同中的金额数字应同时标注大写和小写', '建议所有金额同时以阿拉伯数字和中文大写标注，确保一致'),
('签署日期缺失', '合同完整性', 'keyword', '["签署日期","签订日期","生效日期"]', 'low', '合同未明确签署或生效日期', '建议在合同首部或尾部明确签署/生效日期'),
('通知送达条款', '程序性条款', 'keyword', '["通知送达","通讯地址","送达地址"]', 'low', '缺少通知送达地址和方式约定', '建议添加双方通讯地址、联系人、通知方式等条款');
