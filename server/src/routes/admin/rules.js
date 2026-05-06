const router = require('express').Router();
const { body } = require('express-validator');
const { ReviewRule } = require('../../models');
const { logAction } = require('../../middleware/logger');
const { validate } = require('../../utils/validator');

// 规则列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 50, category, rule_type, risk_level, is_active } = req.query;
    const where = {};
    if (category) where.category = category;
    if (rule_type) where.rule_type = rule_type;
    if (risk_level) where.risk_level = risk_level;
    if (is_active !== undefined) where.is_active = is_active === '1';

    const offset = (page - 1) * pageSize;
    const { rows, count } = await ReviewRule.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: parseInt(offset),
    });

    res.json({
      code: 0,
      data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) },
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取规则列表失败' });
  }
});

// 新增规则
router.post('/', [
  body('name').notEmpty().withMessage('规则名称不能为空'),
  body('rule_type').isIn(['keyword', 'regex', 'condition']),
  body('risk_level').isIn(['high', 'medium', 'low']),
], validate, async (req, res) => {
  try {
    const rule = await ReviewRule.create(req.body);
    res.json({ code: 0, message: '规则创建成功', data: rule });
  } catch (err) {
    res.status(500).json({ code: 500, message: '创建规则失败' });
  }
}, logAction('create_rule', 'review_rule'));

// 更新规则
router.put('/:id', async (req, res) => {
  try {
    const rule = await ReviewRule.findByPk(req.params.id);
    if (!rule) {
      return res.status(404).json({ code: 404, message: '规则不存在' });
    }
    await rule.update(req.body);
    res.json({ code: 0, message: '规则更新成功', data: rule });
  } catch (err) {
    res.status(500).json({ code: 500, message: '更新规则失败' });
  }
}, logAction('update_rule', 'review_rule'));

// 删除规则
router.delete('/:id', async (req, res) => {
  try {
    const rule = await ReviewRule.findByPk(req.params.id);
    if (!rule) {
      return res.status(404).json({ code: 404, message: '规则不存在' });
    }
    await rule.destroy();
    res.json({ code: 0, message: '规则已删除' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '删除规则失败' });
  }
}, logAction('delete_rule', 'review_rule'));

// 批量启用/禁用规则
router.put('/batch/toggle', async (req, res) => {
  try {
    const { ids, is_active } = req.body;
    await ReviewRule.update({ is_active }, { where: { id: ids } });
    res.json({ code: 0, message: '批量更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '批量更新失败' });
  }
});

module.exports = router;
