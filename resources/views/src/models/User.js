/**
 * User Model (M) — domain shape and helpers. No UI or API calls.
 */

export class User {
  constructor({ id = null, name = '', email = '' } = {}) {
    this.id = id;
    this.name = name;
    this.email = email;
  }

  static fromApi(data) {
    return new User({
      id: data.id,
      name: data.name ?? '',
      email: data.email ?? '',
    });
  }

  static empty() {
    return new User();
  }

  static isExisting(user) {
    return user != null && user.id != null;
  }
}

export default User;
