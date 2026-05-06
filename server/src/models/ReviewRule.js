const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ReviewRule = sequelize.define('review_rules', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  category: { type: DataTypes.STRING(50), defaultValue: '通用' },
  rule_type: { type: DataTypes.ENUM('keyword', 'regex', 'condition'), defaultValue: 'keyword' },
  keywords: { type: DataTypes.JSON },
  pattern: { type: DataTypes.STRING(500) },
  risk_level: { type: DataTypes.ENUM('high', 'medium', 'low'), defaultValue: 'medium' },
  description: { type: DataTypes.TEXT },
  suggestion: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'review_rules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ReviewRule;
