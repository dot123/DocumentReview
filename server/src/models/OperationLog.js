const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OperationLog = sequelize.define('operation_logs', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER },
  action: { type: DataTypes.STRING(50), allowNull: false },
  target_type: { type: DataTypes.STRING(50) },
  target_id: { type: DataTypes.INTEGER },
  detail: { type: DataTypes.TEXT },
  ip: { type: DataTypes.STRING(50) },
}, {
  tableName: 'operation_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = OperationLog;
