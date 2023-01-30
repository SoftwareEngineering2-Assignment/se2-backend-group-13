const {http, test, got, listen, app, token} = require('./testimports');
// before each , opens the server
test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});
// after we are finished we close the server
test.after.always(async (t) => {
  t.context.server.close();
});

// get users dashboards
test('GET /dashboards get users dashboards', async (t) => {
  // just give the token in query
  const {body, statusCode} = await t.context.got(`dashboards/dashboards?token=${token}`);
  // this test should pass
  t.is(statusCode, 200);
  // the name of my first dashboard is dog
  t.is(body.dashboards[0].name, 'dog');
});

// create dashboard for user
test('POST /create-dashboard create a dashboard for user', async (t) => {
  // give name in body
  const dashb = {name: 'panther'};
  // just give the token in query
  const {body, statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${token}`, {json: dashb});
  // this test should pass
  t.is(statusCode, 200);
  // returns just success
  t.assert(body);
});

// catch err
test('POST /create-dashboard catcherr', async (t) => {
  const dashb = {name: 'panther'};
  const {statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${token}`, {dashb});
  // expecting error 404
  t.is(statusCode, 404);
});

// create same dashboard
test('POST /create-dashboard create same dashboard', async (t) => {
  // give panther in body again
  const dashb = {name: 'panther'};
  // just give the token in query
  const {body, statusCode} = await t.context.got.post(`dashboards/create-dashboard?token=${token}`, {json: dashb});
  // this test should pass
  t.is(statusCode, 200);
  // returns just success
  t.is(body.message, 'A dashboard with that name already exists.');
});

// delete dashboard for user
test('POST /delete-dashboard delete a dashboard for user', async (t) => {
  // we need the id so we get it
  const {body: b1, statusCode: sc1} = await t.context.got(`dashboards/dashboards?token=${token}`);
  t.is(sc1, 200);
  const delID = {id: b1.dashboards[b1.dashboards.length - 1].id};
  // give the token in query
  const {body, statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`, {json: delID});
  // this test should pass
  t.is(statusCode, 200);
  // returns just success
  t.assert(body.success);
});

// delete non existing dashboard
test('POST /delete-dashboard delete non existing dashboard', async (t) => {
  // provide random id
  const {body, statusCode} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`, {json: {id: 5352}});
  // this test should pass
  t.is(statusCode, 200);
  // returns failure
  t.is(body.status, 409);
});

// catch(err)
test('GET /dashboard catch err', async (t) => {
  // give a json in query path
  // and cause a fatal error
  const foundID = {id: 5};
  const {statusCode} = await t.context.got(`dashboards/dashboard?token=${token}&id=${foundID}`);
  // error 404
  t.is(statusCode, 404);
});

// get sources in a dashboard
test('GET /dashboard get sources in a dashboard', async (t) => {
  // we need the id so we get it
  const {body: b1, statusCode: sc1} = await t.context.got(`dashboards/dashboards?token=${token}`);
  t.is(sc1, 200);
  // store it in variable
  const foundID = b1.dashboards[0].id;
  // give the variable in query path alongside the token
  const {statusCode, body} = await t.context.got(`dashboards/dashboard?token=${token}&id=${foundID}`);
  // test passes
  t.is(statusCode, 200);
  // check to see we got the correct dashboard
  t.deepEqual(body.sources, ['animal']);
});

// get sources in a non existingdashboard
test('GET /dashboard get sources in a non existing dashboard', async (t) => {
  // give a similar value but not a correct one
  const foundID = '63c27da117cbf02c5cd23000';
  // give the variable in query path alongside the token
  const {statusCode, body} = await t.context.got(`dashboards/dashboard?token=${token}&id=${foundID}`);
  // test passes
  t.is(statusCode, 200);
  // body returns 409
  t.is(body.status, 409);
});

// update users dashboard
test('POST /save-dashboard update users dashboard', async (t) => {
  // create a new dashboard to update
  // give name in body
  const newboard = {name: 'flamingo'};
  // give the token in query
  const {body: b1, statusCode: sc1} = await t.context.got.post(`dashboards/create-dashboard?token=${token}`, {json: newboard});
  // do test checks
  t.is(sc1, 200);
  t.assert(b1);
  // now get again to get the id of the new dashboard
  const {body: b2, statusCode: sc2} = await t.context.got(`dashboards/dashboards?token=${token}`);
  // do test checks
  t.is(sc2, 200);
  t.assert(b2.success);
  // save the id we want by grabbing the last item
  const flamingoid = b2.dashboards[b2.dashboards.length - 1].id;
  // give the correct json in the body
  const updated = {id: flamingoid, nextId: 420};
  // POST
  const {body, statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${token}`, {json: updated});
  // test checks
  t.is(statusCode, 200);
  t.assert(body);
  // delete the new dashboard since we dont need it
  // give the id inside a json
  const delID = {id: flamingoid};
  const {body: b3, statusCode: sc3} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`, {json: delID});
  // test checks
  t.is(sc3, 200);
  t.assert(b3.success);
});

// update dashboard that doesnt exist
test('POST /save-dashboard update dashboard that doesnt exist', async (t) => {
  // give wrong id
  const updated = {id: '63c27da117cbf02c5cd00000', nextId: 420};
  // POST
  const {body, statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${token}`, {json: updated});
  // test checks
  t.is(statusCode, 200);
  t.is(body.message, 'The selected dashboard has not been found.');
});

// clone dashboard
test('POST /clone-dashboard clone users dashboard', async (t) => {
  // give dog's id and the new name after the cloning
  const clone = {dashboardId: '63d6dd31f115ef11946c24be', name: 'bat'};
  // POST
  const {body, statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${token}`, {json: clone});
  // test checks
  t.is(statusCode, 200);
  t.assert(body.success);
  // clean up
  // get the id of the new dashboard
  const {body: b2, statusCode: sc2} = await t.context.got(`dashboards/dashboards?token=${token}`);
  // do test checks
  t.is(sc2, 200);
  t.assert(b2.success);
  // save the id we want by grabbing the last item
  const batid = b2.dashboards[b2.dashboards.length - 1].id;
  // delete the new dashboard since we dont need it
  // give the id inside a json
  const batdelID = {id: batid};
  const {body: b3, statusCode: sc3} = await t.context.got.post(`dashboards/delete-dashboard?token=${token}`, {json: batdelID});
  // test checks
  t.is(sc3, 200);
  t.assert(b3.success);
});
// clone dashboard but give existing name
test('POST /clone-dashboard clone dashboard but give existing name', async (t) => {
  // give dog's id and name 
  const clone = {dashboardId: '63d6dd31f115ef11946c24be', name: 'dog'};
  // POST
  const {body, statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${token}`, {json: clone});
  // test checks
  t.is(statusCode, 200);
  t.is(body.status, 409);
});
// clone dashboard but give existing name
test('POST /clone-dashboard catcherr', async (t) => {
  // give dog's id and name 
  const clone = {dashboardId: '63d6dd31f115ef11946c24be', name: 'dog'};
  // POST but do a typo on the body
  const {statusCode} = await t.context.got.post(`dashboards/clone-dashboard?token=${token}`, {clone});
  // test check
  t.is(statusCode, 404);
});

// check password needed for wrong dashboard
test('POST /check-password-needed for wrong dashboard', async (t) => {
  // create the json correctly but give wrong dashboardId
  const checkPass = {user: {id: '63bdd8ed050a9611142d3000'}, dashboardId: '63d6dd31f115ef11946c2000'};
  // do the query
  const {statusCode, body} = await t.context.got.post('dashboards/check-password-needed', {json: checkPass});
  // test checks
  t.is(statusCode, 200);
  t.is(body.status, 409);
  t.is(body.message, 'The specified dashboard has not been found.');
});

// check password needed for dashboard with no password
test('POST /check-password-needed for dashboard without password', async (t) => {
  // create a json with dashboardId and user with user.id
  // we will get dashboard "dog" , it has no password
  const checkPass = {user: {id: '63bdd8ed050a9611142d34c4'}, dashboardId: '63d6dd31f115ef11946c24be'};
  // query , no token needed
  const {statusCode, body} = await t.context.got.post('dashboards/check-password-needed', {json: checkPass});
  // test checks
  t.is(statusCode, 200);
  t.assert(body.success);
  t.is(body.owner, 'self');
});

// check password needed for dashboard with password
test('POST /check-password-needed for dashboard with password', async (t) => {
  // create a json with dashboardId and user with user.id
  // we will get dashboard "rhino" , it has a password
  // but since the owner did the query it will work
  const checkPass = {user: {id: '63bdd8ed050a9611142d34c4'}, dashboardId: '63d807eb8269f023449c19dd'};
  // query , no token needed
  const {statusCode, body} = await t.context.got.post('dashboards/check-password-needed', {json: checkPass});
  // test checks
  t.is(statusCode, 200);
  t.assert(body.success);
  t.is(body.owner, 'self');
});

// check password needed for another users dashboard 
test('POST /check-password-needed for another users dashboard ', async (t) => {
  // create a json with dashboardId and user with user.id
  // we will get dashboard "chimp" which doesnt have a password
  const checkPass = {user: {id: '63bdd8ed050a9611142d34c4'}, dashboardId: '63d80c9b858f502b248e3553'};
  // query , no token needed
  const {statusCode, body} = await t.context.got.post('dashboards/check-password-needed', {json: checkPass});
  // test checks
  t.is(statusCode, 200);
  t.assert(body.success);
  t.assert(body.shared);
});

// check password needed for another users dashboard that has password
test('POST /check-password-needed for another users dashboard with password ', async (t) => {
  // create a json with dashboardId and user with user.id
  // we will get dashboard "monkey" which has a password
  const checkPass = {user: {id: '63bdd8ed050a9611142d34c4'}, dashboardId: '63d80ca4858f502b248e355c'};
  // query , no token needed
  const {statusCode, body} = await t.context.got.post('dashboards/check-password-needed', {json: checkPass});
  // test checks
  t.is(statusCode, 200);
  t.assert(body.success);
  t.assert(body.passwordNeeded);
});

// check password needed for another users dashboard that isnt shared
test('POST /check-password-needed for another users dashboard that isnt shared', async (t) => {
  // create a json with dashboardId and user with user.id
  // we will get dashboard "spider" that isnt shared
  const checkPass = {user: {id: '63bdd8ed050a9611142d34c4'}, dashboardId: '63d80e215fa7af325cc9361e'};
  // query , no token needed
  const {statusCode, body} = await t.context.got.post('dashboards/check-password-needed', {json: checkPass});
  // test checks
  t.is(statusCode, 200);
  t.assert(body.success);
  // since its not shared we assert !
  t.assert(!body.shared);
});

// check password catcherr
test('POST /check-password-needed catcherr', async (t) => {
  // create a json with dashboardId and user with user.id
  const checkPass = {user: {id: '63bdd8ed050a9611142d34c4'}, dashboardId: '63d80e215fa7af325cc9361e'};
  // query but dont include {json:}
  const {statusCode} = await t.context.got.post('dashboards/check-password-needed', {checkPass});
  // test check
  t.is(statusCode, 404);
});

// check password get dashboard with password
test('POST /check-password for dashboard with password', async (t) => {
  // create a json with dashboardId and password
  // we will get dashboard "rhino" , it has a password
  // but since the owner did the query it will work
  const comparePass = {password: 'password', dashboardId: '63d807eb8269f023449c19dd'};
  // query , no token needed
  const {statusCode, body} = await t.context.got.post('dashboards/check-password', {json: comparePass});
  // test checks
  t.is(statusCode, 200);
  t.assert(body.success);
  t.assert(body.correctPassword);
});

// check password but wrong id
test('POST /check-password for dashboard with wrong id', async (t) => {
  // create a json with dashboardId and password and give wrong id
  const comparePass = {password: 'password', dashboardId: '63d807eb8269f02344900000'};
  // query , no token needed
  const {statusCode, body} = await t.context.got.post('dashboards/check-password', {json: comparePass});
  // test checks
  t.is(statusCode, 200);
  t.is(body.status, 409);
  t.is(body.message, 'The specified dashboard has not been found.');
});

// check password but wrong password
test('POST /check-password for dashboard with wrong password', async (t) => {
  // create a json with dashboardId and password and give wrong id
  const comparePass = {password: 'notpassword', dashboardId: '63d807eb8269f023449c19dd'};
  // query , no token needed
  const {statusCode, body} = await t.context.got.post('dashboards/check-password', {json: comparePass});
  // test checks
  t.is(statusCode, 200);
  t.assert(body.success);
  t.assert(!body.correctPassword);
});

// share dashboard
test('POST /share-dashboard', async (t) => {
  // create a json with dashboardId , i chose 'dog'
  const sharedash = {dashboardId: '63d6dd31f115ef11946c24be'};
  // query with token and body
  const {statusCode, body} = await t.context.got.post(`dashboards/share-dashboard?token=${token}`, {json: sharedash});
  // test checks
  t.is(statusCode, 200);
  t.assert(body.success);
});

// share dashboard but wrong id
test('POST /share-dashboard but wrong id', async (t) => {
  // create a json with dashboardId but give wrong dashboardId
  const sharedash = {dashboardId: '63d6dd31f115ef1194000000'};
  // query with token and body
  const {statusCode, body} = await t.context.got.post(`dashboards/share-dashboard?token=${token}`, {json: sharedash});
  // test checks
  t.is(statusCode, 200);
  t.is(body.status, 409);
});

// change password for dashboard
test('POST /change-password change password for dashboard', async (t) => {
  // create a json with dashboardId and new password
  // i chose rhino since its mine and it has a password
  const sharedash = {dashboardId: '63d807eb8269f023449c19dd', password: 'password'};
  // query with token and body
  const {statusCode, body} = await t.context.got.post(`dashboards/change-password?token=${token}`, {json: sharedash});
  // test checks
  t.is(statusCode, 200);
  t.assert(body.success);
});

// change password for dashboard with wrong id
test('POST /change-password change password for dashboard with wrong id', async (t) => {
  // create a json with dashboardId and new password and give wrong id
  const sharedash = {dashboardId: '63d807eb8269f02340000000', password: 'password'};
  // query with token and body
  const {statusCode, body} = await t.context.got.post(`dashboards/change-password?token=${token}`, {json: sharedash});
  // test checks
  t.is(statusCode, 200);
  t.is(body.status, 409);
});

// create test with no token for authorization file testing
test('POST /change-password with no token', async (t) => {
  // same as before
  const sharedash = {dashboardId: '63d807eb8269f02340000000', password: 'password'};
  // query without token
  const {statusCode} = await t.context.got.post(`dashboards/change-password`, {json: sharedash});
  // test check
  t.is(statusCode, 403);
});
