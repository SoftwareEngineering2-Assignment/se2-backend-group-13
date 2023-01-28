// import modules
const express = require('express');
const {validation, authorization} = require('../middlewares');
const {helpers: {jwtSign}} = require('../utilities/authentication');

const {mailer: {mail, send}} = require('../utilities');

const router = express.Router();

const User = require('../models/user');
const Reset = require('../models/reset');
// create user
router.post('/create',
  (req, res, next) => validation(req, res, next, 'register'),
  async (req, res, next) => {
    // we want username password email in the body
    const {username, password, email} = req.body;
    try {
      // we need new username or email
      const user = await User.findOne({$or: [{username}, {email}]});
      if (user) {
        // if we find duplicate username or email we return error
        return res.json({
          status: 409,
          message: 'Registration Error: A user with that e-mail or username already exists.'
        });
      }
      // otherwise save the new user
      const newUser = await new User({
        username,
        password,
        email
      }).save();
      // also return the new id
      return res.json({success: true, id: newUser._id});
    } catch (error) {
      return next(error);
    }
  });
// login authentication
router.post('/authenticate',
  (req, res, next) => validation(req, res, next, 'authenticate'),
  async (req, res, next) => {
    // username and password in the body
    const {username, password} = req.body;
    try {
      // first find the user then HIS password
      const user = await User.findOne({username}).select('+password');
      // if the body didnt have correct user-password combination
      if (!user) {
        return res.json({
          status: 401,
          message: 'Authentication Error: User not found.'
        });
      }
      // if we found a user , but incorrect password
      if (!user.comparePassword(password, user.password)) {
        return res.json({
          status: 401,
          message: 'Authentication Error: Password does not match!'
        });
      }
      // if everything is correct give the user his token
      return res.json({
        user: {
          username, 
          id: user._id, 
          email: user.email
        },
        token: jwtSign({username, id: user._id, email: user.email})
      });
    } catch (error) {
      return next(error);
    }
  });
// reset password
router.post('/resetpassword',
  (req, res, next) => validation(req, res, next, 'request'),
  async (req, res, next) => {
    // username in the request body
    const {username} = req.body;
    try {
      // search by username
      const user = await User.findOne({username});
      // if theres no user with the given username
      if (!user) {
        return res.json({
          status: 404,
          message: 'Resource Error: User not found.'
        });
      }
      // create the users token and then reset it
      const token = jwtSign({username});
      await Reset.findOneAndRemove({username});
      await new Reset({
        username,
        token,
      }).save();
      // now with the new token send an email
      const email = mail(token);
      send(user.email, 'Forgot Password', email);
      return res.json({
        ok: true,
        message: 'Forgot password e-mail sent.'
      });
    } catch (error) {
      return next(error);
    }
  });
// change password
router.post('/changepassword',
  (req, res, next) => validation(req, res, next, 'change'),
  authorization,
  async (req, res, next) => {
    // password in the request body
    const {password} = req.body;
    // username in the query path
    const {username} = req.query;
    try {
      // find user using username
      const user = await User.findOne({username});
      // return user not found if theres no user
      if (!user) {
        return res.json({
          status: 404,
          message: 'Resource Error: User not found.'
        });
      }
      // if we try to do this back to back it wont work because of timeout
      const reset = await Reset.findOneAndRemove({username});
      if (!reset) {
        return res.json({
          status: 410,
          message: ' Resource Error: Reset token has expired.'
        });
      }
      // change the password
      user.password = password;
      // and save
      await user.save();
      // show that the change has happened
      return res.json({
        ok: true,
        message: 'Password was changed.'
      });
    } catch (error) {
      return next(error);
    }
  });

module.exports = router;
