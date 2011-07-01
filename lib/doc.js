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
 * this should use this.schema to generate a doc from defaults
 * or from a passed in schema if there is none defined on the 
 * constructor.
 */

Doc.spawn = function (schema) {
  var schema = schema || this.schema
    , doc = {};

  if (!schema) { 
    throw new Error('Cannot spawn without a schema');
  }

  for (key in schema.properties) {
    var prop = schema.properties[key];
    if (prop.default) {
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
 * Infer the default file path 
 *
 * NOT TESTED
 */
/*
// breadth first search

function find (file, dir) {
  var listings = fs.readdirSync(dir)
    , result = false
    , subdirs = [];

  while (listing = listings.shift()) {
    var lpath = path.join(dir, listing)
      , stat = fs.statSync(lpath);

    if (stat.isFile() && file == listing) {
      result = lpath; 
      break;
    } else if (stat.isDirectory()) {
      subdirs.push(lpath);
    }
  }

  if (!result) {
    while (subdir = subdirs.shift()) {
      result = find(file, subdir);
      if (result) break;
    }
  }

  return result;
}


Doc.resolve = function(doc) {
  var filepath;
  // is doc a string or an object?
  // if its a string
  // read `data` and look for filenames (sans '.json')
  // in /data that match. if found return the path
  // else return false
  // if its an object
  // is there a type? an id?
  //
  
  datapath = path.join(process.cwd(), 'data');

  if (typeof doc == 'string') {
    filepath = lookFor(doc, datapath);
  }

  if (typeof doc == 'object') {
    //
  }
  isFile = fs.readdirSync(process.cwd()).some(function (l) { return (l == doc) });


  return filepath;
};

Doc.prototype.filepath = function(file) {
  if (file) {
    file = file.split('.').pop();
  } else {
    file = this._id
  }
  return path.join(process.cwd(), 'data', this.type, file + '.json');
};
*/

/**
 * Merge properties of json file into doc
 */

Doc.prototype.read = function(file, props) {
  json = JSON.parse(fs.readFileSync(file));
  
  for (key in json) {
    if (!props || props.indexOf(key) !== -1) {
      this[key] = json[key];
    } 
  }
};

/**
 * Validate document from a schema;
 */

// can valid 'memoize' the validation report? so that a call to validate
// after a call to valid returns the same report?
// why can this work? (because you don't need to revalidate in the same run?)
// why would it not work? (what if you need to revalidate in the same run?)

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
  // here we need to deal with getting attachments, 
  // getting specific revisions, etc. How about using 
  // CouchDB's built in javascript libs for this stuff?

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
