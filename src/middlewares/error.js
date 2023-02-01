/* eslint-disable no-console */
const {pipe, has, ifElse, assoc, identity, allPass, propEq} = require('ramda');
// everything with status 500 gets sent here in production environment
const withFormatMessageForProduction = ifElse(
  allPass([propEq('status', 500), () => process.env.NODE_ENV === 'production']),
  // send message server error
  assoc('message', 'Internal server error occurred.'),
  identity
);
// remove req
module.exports = (error, res) => 
  /**
     * @name error
     * @description Middleware that handles errors
     */
  pipe(
    // give an incoming error the attribute message
    (e) => ({...e, message: e.message}),
    // gives 500 if it doesnt already have it
    ifElse(has('status'), identity, assoc('status', 500)),
    // give the message created previously
    withFormatMessageForProduction,
    // return the modified error
    (fError) => res.status(fError.status).json(fError)
  )(error);
