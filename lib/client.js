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

Client.prototype.push = function(ddoc, targetname) {
  // validate ddoc
  request(this.params('PUT', ddoc, targetname), handler.push);
};


/**
 * DRAFT
 */

Client.prototype.draft = function (file, from) {
  // where to we get the initial doc <from>?
  // 1. json-schema
  // 2. extended document object (like post)
  //
  // e.g, 
  // client.draft('posts/wtf.md', 'post');
  // client.draft('...', schema);
  // should this method know where to get the schema or 
  // 'class' definition? or should we pass it in?
  // will this be a concern with other functions? does it make sense
  // to create a separate generalized function to get the schema/class?
  var doc = {};
  fs.writeFileSync(file, JSON.stringify(doc, null, 2));

  // hide the filesystem reading/writing details in doc
  // and just have a consistent method to call.
  // this could be any kind of doc, with any schema or
  // inherit from document, overwrite .write method for
  // special behavior.
  var doc = constructDocumentFrom(from);
  doc.write(file);

};

Client.prototype.publish = function(doc, targetname) {
  // where do we get the doc from? should that be a file name instead?
  // load the doc here?
  // validate against schema for doc.type
  request(this.params('PUT', doc, targetname), handler.publish);
};

