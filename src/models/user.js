/* eslint-disable func-names */
const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');
const {passwordDigest, comparePassword} = require('../utilities/authentication/helpers');

mongoose.pluralize(null);
// user model
const UserSchema = new mongoose.Schema(
  { // user has email,username,password and registration date
    email: {
      // email is a required string and needs to be unique.its also in lowercase
      index: true,
      type: String,
      unique: 'A user already exists with that email!',
      required: [true, 'User email is required'],
      lowercase: true
    },
    // username is a required string that also needs to be unique
    username: {
      index: true,
      type: String,
      unique: 'A user already exists with that username!',
      required: [true, 'Username is required'],
    },
    // password is a required string with minlength equal to 5
    password: {
      type: String,
      required: [true, 'User password is required'],
      select: false,
      minlength: 5
    },
    registrationDate: {type: Number}
  }
);

// Plugin for Mongoose that turns duplicate errors into regular Mongoose validation errors.

UserSchema.plugin(beautifyUnique);

// Pre save hook that hashes passwords

UserSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    this.password = passwordDigest(this.password);
  }
  if (this.isModified('email') || this.isModified('username')) {
    this.registrationDate = Date.now();
  }
  return next();
});

// Model method that compares hashed passwords

UserSchema.methods.comparePassword = function (password) {
  return comparePassword(password, this.password);
};

module.exports = mongoose.model('users', UserSchema);
