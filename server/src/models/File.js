const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const File = sequelize.define('files', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  filename: { type: DataTypes.STRING(255), allowNull: false },
  original_name: { type: DataTypes.STRING(255), allowNull: false },
  file_type: { type: DataTypes.ENUM('docx', 'pdf'), allowNull: false },
  file_size: { type: DataTypes.BIGINT, defaultValue: 0 },
  cos_key: { type: DataTypes.STRING(500), allowNull: false },
  cos_url: { type: DataTypes.STRING(1000) },
  upload_status: { type: DataTypes.ENUM('uploading', 'completed', 'failed'), defaultValue: 'uploading' },
  text_content: { type: DataTypes.TEXT('long') },
  page_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_scanned: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'files',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

File.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = File;
