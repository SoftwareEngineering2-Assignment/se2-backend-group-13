// import modules
/* eslint-disable max-len */
const express = require('express');
const mongoose = require('mongoose');
const {authorization} = require('../middlewares');

const router = express.Router();

const Dashboard = require('../models/dashboard');
const Source = require('../models/source');

// get users dashboards
router.get('/dashboards',
  authorization,
  async (req, res, next) => {
    try {
      // id inside token in query
      const {id} = req.decoded;
      // find using owner ID
      const foundDashboards = await Dashboard.find({owner: mongoose.Types.ObjectId(id)});
      // initialize the returned array
      const dashboards = [];
      foundDashboards.forEach((s) => {
        // append id name and views
        dashboards.push({
          id: s._id,
          name: s.name,
          views: s.views
        });
      });
      // returned json has success and the dashboards
      return res.json({
        success: true,
        dashboards
      });
    } catch (err) {
      return next(err.body);
    }
  });
// create dashboard for a user
router.post('/create-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      // give just the dashboads name in body
      const {name} = req.body;
      // and user id inside query token
      const {id} = req.decoded;
      // check if the name is taken
      const foundDashboard = await Dashboard.findOne({owner: mongoose.Types.ObjectId(id), name});
      if (foundDashboard) {
        return res.json({
          status: 409,
          message: 'A dashboard with that name already exists.'
        });
      } // otherwise create an empty dashboard and save it
      await new Dashboard({
        name,
        layout: [],
        items: {},
        nextId: 1,
        owner: mongoose.Types.ObjectId(id)
      }).save();

      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 
// delete dashboard
router.post('/delete-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      // ID of the dashboard we want to delete in the body
      const {id} = req.body;
      // check if the ID matches the owner
      const foundDashboard = await Dashboard.findOneAndRemove({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The selected dashboard has not been found.'
        });
      }
      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 
// get sources in a dashboard
router.get('/dashboard',
  authorization,
  async (req, res, next) => {
    try {
      // dashboards ID in query
      const {id} = req.query;
      // check if the ID matches the owner
      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The selected dashboard has not been found.'
        });
      }
      // return the dashboard
      const dashboard = {};
      dashboard.id = foundDashboard._id;
      dashboard.name = foundDashboard.name;
      dashboard.layout = foundDashboard.layout;
      dashboard.items = foundDashboard.items;
      dashboard.nextId = foundDashboard.nextId;
      // and the sources inside it
      const foundSources = await Source.find({owner: mongoose.Types.ObjectId(req.decoded.id)});
      const sources = [];
      foundSources.forEach((s) => {
        sources.push(s.name);
      });
      // return dashboard and sources
      return res.json({
        success: true,
        dashboard,
        sources
      });
    } catch (err) {
      return next(err.body);
    }
  });
// update dashboard
router.post('/save-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      // body should include these
      const {id, layout, items, nextId} = req.body;
      // search for the dashboard
      const result = await Dashboard.findOneAndUpdate({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)}, {
        $set: {
          // change these variables
          layout,
          items,
          nextId
        }
      }, {new: true});
      // check if we found a dashboard by id
      if (result === null) {
        return res.json({
          status: 409,
          message: 'The selected dashboard has not been found.'
        });
      }
      // return success to the user if we succeeded
      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 
// clone dashboard
router.post('/clone-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      // dashboard's ID and the new name in body
      const {dashboardId, name} = req.body;
      // find users dashboard with that name
      const foundDashboard = await Dashboard.findOne({owner: mongoose.Types.ObjectId(req.decoded.id), name});
      // if the name is a duplicate we return 409
      if (foundDashboard) {
        return res.json({
          status: 409,
          message: 'A dashboard with that name already exists.'
        });
      }
      // if the name is not a duplicate we find the dashboard with that id
      const oldDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId), owner: mongoose.Types.ObjectId(req.decoded.id)});
      // create a duplicate dashboard but with different name
      await new Dashboard({
        name,
        layout: oldDashboard.layout,
        items: oldDashboard.items,
        nextId: oldDashboard.nextId,
        owner: mongoose.Types.ObjectId(req.decoded.id)
      }).save();

      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 
// basically get a dashboard but for dashboard without password
router.post('/check-password-needed', 
  async (req, res, next) => {
    try {
      // user and dashboardId in body
      const {user, dashboardId} = req.body;
      // user input must have id value
      const userId = user.id;
      // find using dashboardId
      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId)}).select('+password');
      // return error if it doesnt exist
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The specified dashboard has not been found.'
        });
      }
      // create the return object and fill it with the found dashboard
      const dashboard = {};
      dashboard.name = foundDashboard.name;
      dashboard.layout = foundDashboard.layout;
      dashboard.items = foundDashboard.items;
      // if the owner did the search we dont check for password
      if (userId && foundDashboard.owner.equals(userId)) {
        foundDashboard.views += 1;
        await foundDashboard.save();
        // return success and the dashboard
        return res.json({
          success: true,
          owner: 'self',
          shared: foundDashboard.shared,
          hasPassword: foundDashboard.password !== null,
          dashboard
        });
      } 
      // now we are checking other users' dashboards
      // if the dashboard is not shared return 'empty' json
      if (!(foundDashboard.shared)) {
        return res.json({
          success: true,
          owner: '',
          shared: false
        });
      } 
      // now we are checking another users' shared dashboard
      // if the dashboard doesnt have password increase its view
      if (foundDashboard.password === null) {
        foundDashboard.views += 1;
        await foundDashboard.save();
        // and return the dashboard
        return res.json({
          success: true,
          owner: foundDashboard.owner,
          shared: true,
          passwordNeeded: false,
          dashboard
        });
      }
      // if it has a password we return nothing
      return res.json({
        success: true,
        owner: '',
        shared: true,
        passwordNeeded: true
      }); // error handling
    } catch (err) {
      return next(err.body);
    }
  }); 
// basically get dashboard for dashboard with password
router.post('/check-password', 
  async (req, res, next) => {
    try {
      // dashboardId and password in body
      const {dashboardId, password} = req.body;
      // find using id
      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId)}).select('+password');
      // return error if we didnt find anything
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The specified dashboard has not been found.'
        });
      }
      // compare the password with the one we gave
      // and if its wrong return wrongpassword
      if (!foundDashboard.comparePassword(password, foundDashboard.password)) {
        return res.json({
          success: true,
          correctPassword: false
        });
      }
      // if the password is correct we increase views
      foundDashboard.views += 1;
      // and save it
      await foundDashboard.save();
      // and store it in dashboard json
      // with name layout and items
      const dashboard = {};
      dashboard.name = foundDashboard.name;
      dashboard.layout = foundDashboard.layout;
      dashboard.items = foundDashboard.items;
      // return dashboard json to user along with success
      return res.json({
        success: true,
        correctPassword: true,
        owner: foundDashboard.owner,
        dashboard
      });
    } catch (err) {
      return next(err.body);
    }
  }); 
// this is the function that copies to clipboard the dashboard
// if you want to share it but i dont see the functionality here
router.post('/share-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      // dashboardId in body
      const {dashboardId} = req.body;
      // token in query
      const {id} = req.decoded;
      // find owners dashboard using his and its id
      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId), owner: mongoose.Types.ObjectId(id)});
      // if both conditions arent met we return error
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The specified dashboard has not been found.'
        });
      }// we do ! for some reason
      foundDashboard.shared = !(foundDashboard.shared);
      // save
      await foundDashboard.save();
      // return to user success and opposite of shared value
      return res.json({
        success: true,
        shared: foundDashboard.shared
      });
    } catch (err) {
      return next(err.body);
    }
  }); 
// change the password needed to share a dashboard
router.post('/change-password', 
  authorization,
  async (req, res, next) => {
    try {
      // dashboardId and its password in body
      const {dashboardId, password} = req.body;
      // token in path
      const {id} = req.decoded;
      // find users dashboard using his and its id
      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId), owner: mongoose.Types.ObjectId(id)});
      // if both conditions arent met we return error
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The specified dashboard has not been found.'
        });
      } // store the password
      foundDashboard.password = password;
      // and save it to the database
      await foundDashboard.save();
      // return just success to the user
      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 

module.exports = router;
