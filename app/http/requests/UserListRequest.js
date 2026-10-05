/**
 * User List Request — parses and validates query params (like Laravel Form Request).
 */

export function parseUserListQuery(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const perPage = Math.min(parseInt(req.query.per_page, 10) || 10, 100);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  return {
    page,
    perPage,
    limit: perPage,
    offset: (page - 1) * perPage,
    search: search || undefined,
  };
}

export default parseUserListQuery;
