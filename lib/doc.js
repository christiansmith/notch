/**
 * Module dependencies
 */ 

var _ = require('underscore')
  , URL = require('url')
  , JSV = require('jsv').JSV
  , env = JSV.createEnvironment()
  , request = require('request')
  , util = require('util')
  , path = require('path')
  , fs = require('fs');

/**
 * Doc constructor
 */

function Doc (doc) {
  this.initialize(doc);
}

/**
 * Make request accessible from Doc so we can spy on it
 * in our tests. This is a kludgey workaround. I might be 
 * missing something in the jasmine docs.
 */

Doc.request = request;

/**
 * Extend Doc
 *
 * This method is adapted from the pattern described in 
 * Pro JavaScript Design Patterns, as well as Backbone's 
 * `extend`/`inherits` functions.
 */

function F () {}

Doc.extend = function (proto, static) {
  // `this` refers to the constructor on which `extend` was called as a
  // static method. That constructor might be `Doc` or it might be a class 
  // that extends `Doc`, directly or indirectly.
  var superClass = this;

  // `subClass` is the new constructor we will eventually return. 
  // superClass is applied to `this` 
  var subClass = function () {
    superClass.apply(this, arguments);
  };

  // We use an empty constructor to set up the prototype of 
  // subClass in order to avoid potential costs or side effects
  // of instantiating superClass.
  F.prototype = superClass.prototype;
  subClass.prototype = new F();

  // Here we merge properties of the `proto` argument into
  // subClass.prototype. Properties of proto will override 
  // those of subClass.prototype.
  _.extend(subClass.prototype, proto);

  // Merge properties of superClass and `static` argument
  // into subClass. `static` properties will override superClass.
  // Note that it is possible, though not advisable, to replace `extend`.
  _.extend(subClass, superClass, static);

  // Initialize the value of prototype.constructor
  // and create a superclass reference
  subClass.prototype.constructor = subClass;
  subClass.superclass = superClass.prototype;

  return subClass;
};

/**
 * Read a doc from a file
 */

Doc.read = function (file) {
  json = JSON.parse(fs.readFileSync(file));
  return new this(json);
};

/**
 * Spawn a new Doc from a schema
 *
 * spawn should use this.schema to generate a doc from defaults
 * or from a passed in schema if there is none defined on the 
 * constructor.
 */

Doc.spawn = function (schema) {
  var schema = schema || this.schema || { properties: {} }
    , doc = {};

  if (!schema) { 
    throw new Error('Cannot spawn without a schema');
  }

  for (key in schema.properties) {
    var prop = schema.properties[key];
    if (prop.default || prop.default == '') {
      doc[key] = prop.default;
    } 
  }

  return new this(doc);
};

/**
 * Initialize properties of this
 */

Doc.prototype.initialize = function (doc) {
  for (prop in doc) {
    if (doc.hasOwnProperty(prop)) {
      this[prop] = doc[prop];
    }
  }
};

/**
 * Merge properties of json file into doc
 */

Doc.prototype.read = function(file, props) {
  //if (path.existsSync(file)) {
    json = JSON.parse(fs.readFileSync(file));
    
    for (key in json) {
      if (!props || props.indexOf(key) !== -1) {
        this[key] = json[key];
      } 
    }
  //}
};

/**
 * Validate document from a schema;
 */

Doc.prototype.validate = function(schema) {
  var schema = schema || this.constructor.schema;
  return env.validate(this, schema);
};

Doc.prototype.valid = function(schema) {
  var report = this.validate(schema)
    , validity = false;
  if (report.errors.length === 0) validity = true;
  return validity;
};

/**
 * Generate a URL for this doc from a target
 */

Doc.prototype.url = function (target, method) {
  var url = URL.parse(target.url);

  url.pathname = path.join(url.pathname, this._id);

  if (this._rev && method == 'delete') {
    url.query = { rev: this._rev };
  } else if (this._rev) {
    url.query = { _rev: this._rev };
  }

  if (target.auth) {
    url.host = target.auth + '@' + url.host;
  }

  return URL.format(url);
};

/**
 * Write a doc to the filesystem.
 */

Doc.prototype.write = function(file) {
  fs.writeFileSync(file, JSON.stringify(this, null, 2));
};

/**
 * GET a document from a couchdb database and pass it to a callback
 */

Doc.get = function(id, target, callback) {
  var url = URL.parse(target.url);
  url.pathname = path.join(url.pathname, id);
  var params = { method: 'GET', uri: URL.format(url) };

  Doc.request(params, callback);
};

/**
 * PUT a Doc instance to a couchdb database
 */

Doc.prototype.put = function (target, callback) {
  var method = (this._id) ? 'PUT' : 'POST'
    , params = { method: method, uri: this.url(target), json: this };

  Doc.request(params, callback);
};

/**
 * DELETE a Doc instance from a couchdb database
 */

Doc.prototype.del = function (target, callback) {
  var params = { method: 'DELETE', uri: this.url(target, 'delete') };
  Doc.request(params, callback);
};

module.exports = Doc;
