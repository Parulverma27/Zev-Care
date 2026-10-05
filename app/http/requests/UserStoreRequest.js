/**
 * User Store Request — validation rules for POST /users.
 */

export const userStoreRules = {
  name: { required: true, minLength: 1, maxLength: 255 },
  email: { required: true, email: true, maxLength: 255 },
};

export default userStoreRules;
