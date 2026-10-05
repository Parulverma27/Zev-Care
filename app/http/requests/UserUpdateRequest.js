/**
 * User Update Request — validation rules for PUT /users/:id.
 */

export const userUpdateRules = {
  name: { minLength: 1, maxLength: 255 },
  email: { email: true, maxLength: 255 },
};

export default userUpdateRules;
