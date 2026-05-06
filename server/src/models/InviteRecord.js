const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const InviteRecord = sequelize.define('invite_records', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  inviter_id: { type: DataTypes.INTEGER, allowNull: false },
  invitee_id: { type: DataTypes.INTEGER, allowNull: false },
  reward_type: { type: DataTypes.STRING(30) },
}, {
  tableName: 'invite_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

InviteRecord.belongsTo(User, { foreignKey: 'inviter_id', as: 'inviter' });
InviteRecord.belongsTo(User, { foreignKey: 'invitee_id', as: 'invitee' });

module.exports = InviteRecord;
