// imports
/* eslint-disable max-len */
const express = require('express');
const got = require('got');

const router = express.Router();

const User = require('../models/user');
const Dashboard = require('../models/dashboard');
const Source = require('../models/source');
// get statistics from homepage
router.get('/statistics',
  async (req, res, next) => {
    try {
      // from user model apply count function
      const users = await User.countDocuments();
      // from dashboard model apply count function
      const dashboards = await Dashboard.countDocuments();
      // from dashboard model sum views of each one
      const views = await Dashboard.aggregate([
        {
          $group: {
            _id: null, 
            views: {$sum: '$views'}
          }
        }
      ]); // from sources model apply count function
      const sources = await Source.countDocuments();
      // count total views
      let totalViews = 0;
      if (views[0] && views[0].views) {
        totalViews = views[0].views;
      }
      // return to user the number of users,dashboards,views and sources
      return res.json({
        success: true,
        users,
        dashboards,
        views: totalViews,
        sources
      });// error handling
    } catch (err) {
      return next(err.body);
    }
  });
// test any url
router.get('/test-url',
  async (req, res) => {
    try {
      // give the desired url in query
      const {url} = req.query;
      // hit the url and get statuscode
      const {statusCode} = await got(url);
      return res.json({
        // return the statusCode in body
        status: statusCode,
        // and wether the site is active or not
        active: (statusCode === 200),
      });// error handling
    } catch (err) {
      return res.json({
        // return 500
        status: 500,
        // and inactive
        active: false,
      });
    }
  });
// test a request on any url
router.get('/test-url-request',
  async (req, res) => {
    try {
      const {url, type, headers, body: requestBody, params} = req.query;
      let statusCode;
      let body;
      switch (type) {
        case 'GET':
          ({statusCode, body} = await got(url, {
            headers: headers ? JSON.parse(headers) : {},
            searchParams: params ? JSON.parse(params) : {}
          }));
          break;
        case 'POST':
          ({statusCode, body} = await got.post(url, {
            headers: headers ? JSON.parse(headers) : {},
            json: requestBody ? JSON.parse(requestBody) : {}
          }));
          break;
        case 'PUT':
          ({statusCode, body} = await got.put(url, {
            headers: headers ? JSON.parse(headers) : {},
            json: requestBody ? JSON.parse(requestBody) : {}
          }));
          break;
        default:
          statusCode = 500;
          body = 'Something went wrong';
      }
      
      return res.json({
        status: statusCode,
        response: body,
      });
    } catch (err) {
      return res.json({
        status: 500,
        response: err.toString(),
      });
    }
  });

module.exports = router;
