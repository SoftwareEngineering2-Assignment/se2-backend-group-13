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
  const delID = {id: b1.dashboards[1].id};
  // just give the token in query
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

// // update users dashboard
// test('POST /save-dashboard update users dashboard', async (t) => {
//   // create a new dashboard to update
//   // give name in body
//   const newboard = {name: 'flamingo'};
//   // just give the token in query
//   const {body:b1, statusCode: sc1} = await t.context.got.post(`dashboards/create-dashboard?token=${token}`, {json: newboard});
//   t.is(sc1, 200);

//   // tomorrow
//   const updated = {name: 'flamingo' , layout: Array ,items: }


//   const {body, statusCode} = await t.context.got.post(`dashboards/save-dashboard?token=${token}`, {json: updated});
//   // this test should pass
//   t.is(statusCode, 200);
//   // returns just success
//   t.assert(body.success);
// });
