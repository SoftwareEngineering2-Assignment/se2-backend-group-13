// imports
const {isNil} = require('ramda');

const yup = require('yup');
// give functions to email
const email = yup
  .string()
  .lowercase()
  .trim()
  .email();
// give functions to username
const username = yup
  .string()
  .trim();
// give functions to password
const password = yup
  .string()
  .trim()
  .min(5);
// initialize request
const request = yup.object().shape({username: username.required()});
// initialize authenticate to require username and password
const authenticate = yup.object().shape({
  username: username.required(),
  password: password.required()
});
// initialize register to require username password and email
const register = yup.object().shape({
  email: email.required(),
  password: password.required(),
  username: username.required()
});
// initialize update to require username and password and ask for them if they are missing
const update = yup.object().shape({
  username,
  password
}).test({
  message: 'Missing parameters',
  test: ({username: u, password: p}) => !(isNil(u) && isNil(p))
});
// initiailze change password
const change = yup.object().shape({password: password.required()});
// export all these functions
module.exports = {
  authenticate, register, request, change, update
};
