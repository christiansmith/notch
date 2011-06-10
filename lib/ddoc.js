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
 * Read revision from a file
 */

DDoc.prototype.revision = function() {
  var rev_path = path.join(process.cwd(), 'rev.json')
    , versioned = fs.readdirSync(process.cwd())
                    .some(function (l) { return (l == 'rev.json' ) });

  if (versioned) {
    var rev_file = fs.readFileSync(rev_path, 'utf8');

    // this is still a string, not an object.
    var rev_obj = JSON.parse(rev_file);
  
    if (typeof rev_obj == 'string') {
      rev_obj = JSON.parse(rev_obj);
    }

    this._rev = rev_obj.rev;
  }
};

/**
 * Traverse an object, converting functions into strings
 *
 * Note: this should be treated as a private method. It is 
 * included in DDoc for testing.
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
// but doesn't yet handle that
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

  // checking for an arg is probably not the best way to do this
  // should find another condition
  if (subdir) {
    return obj;
  } else {
    this[pth] = obj;
  }
};

/**
 * Validate the `this` against a json-schema for ddocs
 */
