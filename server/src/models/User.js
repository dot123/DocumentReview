const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('users', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  openid: { type: DataTypes.STRING(128), allowNull: false, unique: true },
  unionid: { type: DataTypes.STRING(64) },
  device_id: { type: DataTypes.STRING(128) },
  phone: { type: DataTypes.STRING(20) },
  nickname: { type: DataTypes.STRING(64), defaultValue: '用户' },
  avatar_url: { type: DataTypes.TEXT },
  role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
  status: { type: DataTypes.ENUM('active', 'disabled'), defaultValue: 'active' },
  member_level: { type: DataTypes.ENUM('free', 'vip', 'svip'), defaultValue: 'free' },
  member_expire_at: { type: DataTypes.DATE },
  inviter_id: { type: DataTypes.INTEGER },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
