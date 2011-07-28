/**
 * HELPERS FOR BUILDING AND VALIDATING A DDOC
 */

/**
 * Module Dependencies
 */

var Doc = require('./doc')
  , load = require('./load')
  , mime = require('mime')
  , path = require('path')
  , fs = require('fs');

/**
 * DDoc constructor extends Doc
 */

var DDoc = Doc.extend({

  initialize: function (id) {
    var properties = this.constructor.schema.properties;

    // similar to Doc.spawn, but mutates
    // `this` instead of returning a new doc
    for (key in properties) {
      var prop = properties[key];
      if (prop.default) {
        this[key] = prop.default;
      }
    }

    // if DDoc is passed an id, override the default
    if (id) this._id = '_design/' + id;
  },   

  // Traverse an object, converting functions into strings
  // Note: this should be treated as a private method. It is 
  // included in DDoc for testing.
  strfn: function (obj) {
    for (var prop in obj) {
      switch (typeof obj[prop]) {
        case 'function':
          obj[prop] = obj[prop].toString();
          break;

        case 'object':
          // this also handles arrays
          obj[prop] = this.strfn(obj[prop]);
          break;

        default: 
          // if the value isn't a function or 
          // object/array, pass over it.
          break;
      }
    }
    return obj;
  },

  // Assign a view object to ddoc.views, converting the 
  // map and reduce functions to string representations.
  view: function (name, obj) {
    this.views[name] = this.strfn(obj);
  },

  // Assign a string representation of a list function 
  // to ddoc.lists
  list: function (name, fn) {
    this.lists[name] = fn.toString();
  },

  // Assign a string representation of a show function 
  // to ddoc.shows
  show: function (name, fn) {
    this.shows[name] = fn.toString();
  },

  // Assign a schema object to ddoc.schemas
  schema: function (name, obj) {
    this.schemas[name] = obj;
  },

  // Add a rule object to ddoc.rewrites
  rewrite: function (rule) {
    this.rewrites.push(rule);
  },
  
  // Load filesystem contents into ddoc
  load: load,

  // Assign a string representation of a function
  // to ddoc.validate_doc_update
  validation: function(fn) {
    this.validate_doc_update = fn.toString();
  },

  // Compose a filepath for this ddoc
  filepath: function () {
    var filename = this._id.split('/').pop() + '.json';
    return path.join(process.cwd(), 'data/ddocs', filename);
  }, 

  // Set a known revision on this ddoc
  revision: function() {
    var file = this.filepath();
    // this condition may end up as part of this.read()
    if (path.existsSync(file)) {
      this.read(file, ['_rev']);
    }
    return this._rev;
  },

  // Make sure we have the revision before sending to 
  // the server.
  put: function (target, callback) {
    this.revision();
    this.constructor.superclass.put.call(this, target, callback);
  },

}, {
  // Define the static property `schema` on DDoc
  schema: {
    type: 'object',
    properties: {
      _id: { type: 'string', default: '_design/app' },
      _rev: { type: 'string' },
      _attachments: { type: 'object', default: {} },
      views: { type: 'object', default: {}, required: true },
      lists: { type: 'object', default: {}, required: true },
      shows: { type: 'object', default: {}, required: true },
      schemas: { type: 'object', default: {}, required: true },
      rewrites: { type: 'array', default: [], required: true }
    }
  } 
});

module.exports = DDoc;
