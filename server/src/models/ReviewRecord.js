const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const File = require('./File');

const ReviewRecord = sequelize.define('review_records', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  file_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'), defaultValue: 'pending' },
  results: { type: DataTypes.JSON },
  risk_summary: { type: DataTypes.JSON },
  report_cos_key: { type: DataTypes.STRING(500) },
  report_cos_url: { type: DataTypes.STRING(1000) },
  duration: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'review_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

ReviewRecord.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
ReviewRecord.belongsTo(File, { foreignKey: 'file_id', as: 'file' });

module.exports = ReviewRecord;
