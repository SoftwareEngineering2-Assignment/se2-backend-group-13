/* eslint-disable func-names */
const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');
const {constants: {expires}} = require('../utilities/validation');
// reset model
const ResetSchema = new mongoose.Schema({
  // username is required and a unique token corresponds to it
  username: {
    index: true,
    type: String,
    required: true,
    unique: 'A token already exists for that username!',
    lowercase: true
  },
  // token required
  token: {
    type: String,
    required: true
  },
  expireAt: {
    type: Date,
    default: Date.now,
    // 12 hours
    index: {expires},
  },
});

// Plugin for Mongoose that turns duplicate errors into regular Mongoose validation errors.

ResetSchema.plugin(beautifyUnique);

mongoose.pluralize(null);
module.exports = mongoose.model('reset-tokens', ResetSchema);
