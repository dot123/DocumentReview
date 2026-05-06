const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      code: 422,
      message: '参数校验失败',
      errors: errors.array(),
    });
  }
  next();
}

module.exports = { validate };
