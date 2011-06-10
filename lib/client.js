/**
 * Module dependencies
 */

var request = require('request')
  , path = require('path')
  , URL = require('url')
  , fs = require('fs');

/**
 * Client object constructor
 */

function Client (config) {
  this.config = config;
}

module.exports = Client;

/**
 * Construct a URL to push the app to a specified target.
 */ 

Client.prototype.url = function(app, targetname) {
  var target = this.target(targetname)
    , url = URL.parse(target.url);

  // add ddoc id to database location
  url.pathname = path.join(url.pathname, app._id);

  // add ddoc revision to querystring
  if (app._rev) {
    url.query = { _rev: app._rev };
  }

  // add basic authorization to host
  if (target.auth) {
    url.host = target.auth + '@' + url.host;
  }

  return URL.format(url);
};

/**
 * Get a target object from config
 */

Client.prototype.target = function(name) {
  return this.config.targets[name];
};

/**
 * Named callback for request() to facilitate testing
 */

Client.prototype.handleServerResponse = function (err, response, body) {
  switch (response.statusCode) {
    case 201:
      fs.writeFileSync('rev.json', JSON.stringify(body));
      console.log('wrote to target');
      break;

    default:
      console.log(body);
      break;
  }
};

/**
 * Push a ddoc to a configured target
 */

Client.prototype.push = function(app, targetname) {
  //if (app.valid()) {
    var params = { uri: this.url(app, targetname), method: 'PUT', json: app };
    request(params, this.handleServerResponse);
  //}
};