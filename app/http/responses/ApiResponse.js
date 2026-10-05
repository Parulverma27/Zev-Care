/**
 * Standard API JSON responses — keeps controllers thin (View layer of API MVC).
 */

export class ApiResponse {
  static ok(res, data, meta = null) {
    return res.json({
      success: true,
      data,
      ...(meta ? { meta } : {}),
    });
  }

  static created(res, data) {
    return res.status(201).json({ success: true, data });
  }

  static message(res, message, status = 200) {
    return res.status(status).json({ success: true, message });
  }

  static notFound(res, message = 'Resource not found') {
    return res.status(404).json({ success: false, message });
  }

  static validationError(res, message, errors = []) {
    return res.status(422).json({ success: false, message, errors });
  }

  static fail(res, message, status = 400) {
    return res.status(status).json({ success: false, message });
  }
}

export default ApiResponse;
