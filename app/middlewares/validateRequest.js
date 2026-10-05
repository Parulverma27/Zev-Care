/**
 * Request Validation Middleware (like Laravel Form Requests).
 */

export function validateRequest(schema) {
  return (req, res, next) => {
    const toValidate = typeof schema === 'function' ? schema(req) : schema;
    const errors = [];

    for (const [field, rules] of Object.entries(toValidate)) {
      const value = req.body[field] ?? req.query[field];
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }
      if (value === undefined || value === null || value === '') continue;
      if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push({ field, message: `${field} must be a valid email` });
      }
      if (rules.minLength && String(value).length < rules.minLength) {
        errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
      }
      if (rules.maxLength && String(value).length > rules.maxLength) {
        errors.push({ field, message: `${field} must be at most ${rules.maxLength} characters` });
      }
    }

    if (errors.length) {
      return res.status(422).json({ success: false, message: 'Validation failed', errors });
    }
    next();
  };
}
