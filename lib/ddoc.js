/**
 * HELPERS FOR BUILDING AND VALIDATING A DDOC
 */

/**
 * Module Dependencies
 */

var path = require('path')
  , fs = require('fs');

/**
 * DDoc constructor
 */

function DDoc (id) {
  this._id = '_design/' + id;
  this.views = {};
  this.lists = {};
  this.shows = {};
  this.schemas = {}
  this.rewrites = []
}

module.exports = DDoc;

/**
 * Traverse an object, converting functions into strings
 */

DDoc.prototype.strfn = function(obj) {
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
};

/**
 * Assign a view object to ddoc.views, converting the 
 * map and reduce functions to string representations.
 */

DDoc.prototype.view = function(name, obj) {
  this.views[name] = this.strfn(obj);
};

/**
 * Assign a string representation of a list function 
 * to ddoc.lists
 */

DDoc.prototype.list = function(name, fn) {
  this.lists[name] = fn.toString();
};

/**
 * Assign a string representation of a show function 
 * to ddoc.shows
 */

DDoc.prototype.show = function(name, fn) {
  this.shows[name] = fn.toString();
};

/**
 * Assign a schema object to ddoc.schemas
 */

DDoc.prototype.schema = function(name, obj) {
  // can meta-validate schema obj
  this.schemas[name] = obj;
};

/**
 * Assign a string representation of a function
 * to ddoc.validate_doc_update
 */

DDoc.prototype.validation = function(fn) {
  this.validate_doc_update = fn.toString();
};

/**
 * Add a rule object to ddoc.rewrites
 */

DDoc.prototype.rewrite = function(rule) {
  // validate the rule against a schema?
  this.rewrites.push(rule);
};

/**
 * Load filesystem contents into ddoc
 */


// should be able to load a dir that is not in cwd
// I don't think it can do this at the moment
DDoc.prototype.load = function(pth, subdir) {
  var self = this
    , listings = fs.readdirSync(pth)
    , obj = {};

  listings.forEach(function (listing) {
    var file = path.join(pth, listing)
      , prop = listing.split('.')[0]
      , stat = fs.statSync(file);

    if (stat.isFile()) {
      var content = fs.readFileSync(file).toString();
      obj[prop] = content;
    } else if (stat.isDirectory()) {
      obj[listing] = self.load(file, true);
    }
  });

  // is there something else i can check for?
  // if self === this?
  if (subdir) {
    return obj;
  } else {
    this[pth] = obj;
  }
};



/**
 *
 *

DDoc.prototype.validate = function() {
  // validate `this` against a json-schema
};
*/
