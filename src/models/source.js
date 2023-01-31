/* eslint-disable func-names */
const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');

mongoose.pluralize(null);
// source model
const SourceSchema = new mongoose.Schema(
  { // source has name,type,url,login,passcode,vhost,owner and creation date
    // name is a required string
    name: {
      index: true,
      type: String,
      required: [true, 'Source name is required']
    },
    // rest are strings
    type: {type: String},
    url: {type: String},
    login: {type: String},
    passcode: {type: String},
    vhost: {type: String},
    // set to mongoose ObjectId 
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {type: Date}
  }
);

// Plugin for Mongoose that turns duplicate errors into regular Mongoose validation errors.

SourceSchema.plugin(beautifyUnique);

// Pre save hook that hashes passwords

SourceSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.createdAt = Date.now();
  }
  return next();
});

module.exports = mongoose.model('sources', SourceSchema);
