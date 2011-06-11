/**
 * Module dependencies
 */

var request = require('request')
  , handler = require('./handler')
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
 * Construct the URL to push a doc to a specified target.
 */ 

Client.prototype.url = function(doc, targetname) {
  var target = this.target(targetname)
    , url = URL.parse(target.url);

  // add ddoc id to database location
  url.pathname = path.join(url.pathname, doc._id);

  // add doc revision to querystring
  if (doc._rev) {
    url.query = { _rev: doc._rev };
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
 * Build request params argument
 */

Client.prototype.params = function (method, doc, targetname) {
  return {
    method: method,
    uri: this.url(doc, targetname),
    json: doc
  };
};

/**
 * Push a ddoc to a configured target
 */

Client.prototype.push = function(app, targetname) {
  // validate app
  request(this.params('PUT', app, targetname), handler.push);
};


/**
 * DRAFT
 */


Client.prototype.publish = function(doc, targetname) {
  // validate against schema for doc.type
  request(this.params('PUT', doc, targetname), handler.publish);
};

