/**
 * Base Controller — shared HTTP response helpers (View layer for JSON APIs).
 * Controllers should only: parse request → call Service → return response.
 */

export class BaseController {
  success(res, data, meta = null, status = 200) {
    const body = { success: true, data };
    if (meta) body.meta = meta;
    return res.status(status).json(body);
  }

  created(res, data) {
    return this.success(res, data, null, 201);
  }

  message(res, message, status = 200) {
    return res.status(status).json({ success: true, message });
  }

  notFound(res, message = 'Resource not found') {
    return res.status(404).json({ success: false, message });
  }

  unprocessable(res, message) {
    return res.status(422).json({ success: false, message });
  }
}

export default BaseController;
