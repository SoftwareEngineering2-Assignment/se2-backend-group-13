/* eslint-disable max-len */
const express = require('express');
const mongoose = require('mongoose');
// custom function to check for the owners of the sources
const {authorization} = require('../middlewares');

const router = express.Router();

const Source = require('../models/source');
// GET/sources
router.get('/sources',
  // run the auth function
  authorization,
  async (req, res, next) => {
    try {
      // give the id of the user in the query
      const {id} = req.decoded;
      // uses the users id to find all his sources
      const foundSources = await Source.find({owner: mongoose.Types.ObjectId(id)});
      // initialize empty array
      const sources = [];
      // iterate over all the users sources
      foundSources.forEach((s) => {
        // append the array
        sources.push({
          id: s._id,
          name: s.name,
          type: s.type,
          url: s.url,
          login: s.login,
          passcode: s.passcode,
          vhost: s.vhost,
          active: false
        });
      });
      // give the sources in the body 
      return res.json({
        success: true,
        sources
      }); // error handling
    } catch (err) {
      return next(err.body);
    }
  });
// POST/source
router.post('/create-source', 
  // likewise
  authorization,
  async (req, res, next) => {
    // try: to not destroy the server
    try {
      // we want the source in the request body
      const {name, type, url, login, passcode, vhost} = req.body;
      // we read the id of the user from the query
      const {id} = req.decoded;
      // if theres a source with the same name we dont go forward
      const foundSource = await Source.findOne({owner: mongoose.Types.ObjectId(id), name});
      if (foundSource) {
        return res.json({
          status: 409,
          message: 'A source with that name already exists.'
        });
      }
      // otherwise we create a new source for the user provided
      await new Source({
        name,
        type,
        url,
        login,
        passcode,
        vhost,
        owner: mongoose.Types.ObjectId(id)
      }).save();

      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 
// PUT/source
router.post('/change-source', 
  // likewise
  authorization,
  async (req, res, next) => {
    // likewise
    try {
      // likewise
      const {id, name, type, url, login, passcode, vhost} = req.body;
      // now we are looking for an id that already exists and has the same owner as the one doing the query
      const foundSource = await Source.findOne({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      // if both requirements werent met we dont do anything
      if (!foundSource) {
        return res.json({
          status: 409,
          message: 'The selected source has not been found.'
        });
      }
      // check if the user has given an already existing name
      const sameNameSources = await Source.findOne({_id: {$ne: mongoose.Types.ObjectId(id)}, owner: mongoose.Types.ObjectId(req.decoded.id), name});
      if (sameNameSources) {
        return res.json({
          status: 409,
          message: 'A source with the same name has been found.'
        });
      }
      // we are good to change the needed fields
      foundSource.name = name;
      foundSource.type = type;
      foundSource.url = url;
      foundSource.login = login;
      foundSource.passcode = passcode;
      foundSource.vhost = vhost;
      await foundSource.save();

      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 
// DELETE/source
router.post('/delete-source', 
  // likewise
  authorization,
  async (req, res, next) => {
    try {
      // in order to delete a source we just need its id
      // we ask for it in the body
      const {id} = req.body;
      // check for the id and the correct user
      const foundSource = await Source.findOneAndRemove({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      // if both condition werent met we dont do anything
      if (!foundSource) {
        return res.json({
          status: 409,
          message: 'The selected source has not been found.'
        });
      }
      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 
// POST/source lets you see another users source by its name
router.post('/source',
  async (req, res, next) => {
    try {
      // request body should include these
      const {name, owner, user} = req.body;
      // saves who the owner is
      const userId = (owner === 'self') ? user.id : owner;
      // finds by name and owner
      const foundSource = await Source.findOne({name, owner: mongoose.Types.ObjectId(userId)});
      if (!foundSource) {
        return res.json({
          status: 409,
          message: 'The selected source has not been found.'
        });
      }
      // if everything works,creates a source with the remaining values
      const source = {};
      source.type = foundSource.type;
      source.url = foundSource.url;
      source.login = foundSource.login;
      source.passcode = foundSource.passcode;
      source.vhost = foundSource.vhost;
      // just returns the json,doesnt save it to the db
      return res.json({
        success: true,
        source
      });
    } catch (err) {
      return next(err.body);
    }
  });
// tomorrow
router.post('/check-sources',
  authorization,
  async (req, res, next) => {
    try {
      // provide a json in body with sources names
      const {sources} = req.body;
      // token in path
      const {id} = req.decoded;
      // initialize what we will return
      const newSources = [];
      // iterate over the number of values inside the body
      for (let i = 0; i < sources.length; i += 1) {
        //  find using the given name or the id of the user commiting the query
        // eslint-disable-next-line no-await-in-loop
        const result = await Source.findOne({name: sources[i], owner: mongoose.Types.ObjectId(id)});
        // if the user doesnt own a source, add it
        if (!result) {
          newSources.push(sources[i]);
        }
      }
      // save to the db the sources the users doesnt own
      for (let i = 0; i < newSources.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Source({
          // the new source has just name and type:stomp
          name: newSources[i],
          type: 'stomp',
          // rest are blank
          url: '',
          login: '',
          passcode: '',
          vhost: '',
          // the user doing the query is the owner of the new sources
          owner: mongoose.Types.ObjectId(id)
        }).save();
      } 
      // return the json to the user
      return res.json({
        success: true,
        newSources
      });
    } catch (err) {
      return next(err.body);
    }
  });

module.exports = router;
