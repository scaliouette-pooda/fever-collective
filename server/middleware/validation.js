const { body, validationResult } = require('express-validator');

const validateRequestBody = () => {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  };
};

const sanitizeInput = (req, res, next) => {
  const sanitizeObj = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/[<>]/g, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObj(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObj(req.body);
  if (req.query) sanitizeObj(req.query);
  if (req.params) sanitizeObj(req.params);

  next();
};

module.exports = { validateRequestBody, sanitizeInput };
