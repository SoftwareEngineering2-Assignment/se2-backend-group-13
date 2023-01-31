/* eslint-disable func-names */
const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');
const {passwordDigest, comparePassword} = require('../utilities/authentication/helpers');

mongoose.pluralize(null);
// dashboard model
const DashboardSchema = new mongoose.Schema(
  // dashboard has name,layout,items,nextId,password,boolean shared,view,owner and created date
  { // name needs to exist
    name: {
      index: true,
      type: String,
      required: [true, 'Dashboard name is required']
    },
    // default layout is empty array
    layout: {
      type: Array,
      default: []
    },
    // default items is empty json
    items: {
      type: Object,
      default: {}
    },
    // default nextid is 1
    nextId: {
      type: Number,
      min: 1,
      default: 1
    },
    // default password is empty
    password: {
      type: String,
      select: false,
      default: null
    },
    // default shared is empty
    shared: {
      type: Boolean,
      default: false
    },
    // views start from 0
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {type: Date}
  }
);

// Plugin for Mongoose that turns duplicate errors into regular Mongoose validation errors.

DashboardSchema.plugin(beautifyUnique);

// Pre save hook that hashes passwords

DashboardSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    this.password = passwordDigest(this.password);
  }
  if (this.isModified('name')) {
    this.createdAt = Date.now();
  }
  return next();
});

// Model method that compares hashed passwords

DashboardSchema.methods.comparePassword = function (password) {
  return comparePassword(password, this.password);
};

module.exports = mongoose.model('dashboards', DashboardSchema);
