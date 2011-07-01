var path = require('path')
  , fs = require('fs');

function Env(config) {
  this.root = process.cwd();

  if (typeof config == 'object') {
    this.config = config;
    this.ddocs = config.ddocs;
    this.models = config.models;
  } else if (typeof config == 'string') {
    var file = path.join(this.root, config)
      , json = fs.readFileSync(file, 'utf8');

    this.config = JSON.parse(json);
    this.loadDDocs();
    this.loadModels();
  } else {
    // load the skeletons
    this.loadSkeletons();
  } 
}

module.exports = Env;

/**
 * Create a map of skeletons in the filesystem
 */

Env.prototype.loadSkeletons = function() {
  var env = this
    , closet = path.join(process.env['HOME'], '.notch/closet');

  this.closet = {
    default: path.join(__dirname, '../skeletons/default/')
  };

  if (path.existsSync(closet)) {
    var listings = fs.readdirSync(closet);
    listings.forEach(function (listing) {
      env.closet[listing] = path.join(closet, listing, '/'); 
    });
  }
};


Env.prototype.loadDDocs = function () {
  var paths = this.config.ddocs;
  this.ddocs = {};
  if (paths) {
    for (key in paths) {
      ddoc_path = path.join(this.root, paths[key]);
      this.ddocs[key.toLowerCase()] = require(ddoc_path); 
    }
  }
};

Env.prototype.loadModels = function() {
  this.models = {};
  if (this.config.models) {
    var req_path = path.join(this.root, this.config.models);
    var models = require(req_path);
    for (key in models) {
      this.models[key.toLowerCase()] = models[key];
    }
  }
};

Env.prototype.getDDoc = function (key) {
  return this.ddocs[key];
};

Env.prototype.getModel = function (key) {
  return this.models[key];
};

Env.prototype.getSchema = function (key) {
  return this.models[key].schema;
};

Env.prototype.getTarget = function (key) {
  var targets = this.config.targets;

  if (!key) {
    for (var target in targets) {
      if (targets[target].default) {
        key = target; 
        break;
      }
    }
  }

  return this.config.targets[key];
};

/**
 *
Env.prototype.validate = function() {
  // validate the environment against a json-schema?
  // can json-schema be extended to validate types?
};
*/
