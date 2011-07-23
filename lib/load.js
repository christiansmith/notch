/**
 * Module dependencies
 */

var stylus = require('stylus')
  , jade = require('jade')
  , mime = require('mime')
  , path = require('path')
  , fs = require('fs');

/**
 * Infer load options type from other 
 * option properties.
 */

function type (options) {
  var types = ['attachments', 'files', 'modules', 'json'];
  for (var key in options) {
    if (types.indexOf(key) !== -1) {
      return key;
    }
  }
}

/**
 * Derive complete load config from abbreviated 
 * arguments.
 */

function expand (dir, options) {
  if (!options) {
    if (typeof dir === 'string') {
      options = {};
    } else if (typeof dir === 'object') {
      options = dir;
      options.type = type(options);
      dir = options[options.type];
    }
  }

  if (!options.type)
    options.type = (dir == '_attachments')
      ? 'attachments'
      : type(options) || 'files';

  options.root = process.cwd();

  if (options.type == 'attachments') {
    options.base = dir; //path.join(options.root, dir);
    options.dir = '.';
  } else {
    options.base = path.join(dir, '..');//options.root, dir, '..');
    options.dir = dir.split('/').pop();
  }

  return options;
}

/**
 * Walk a directory and build an array of 
 * relative file paths.
 */

function walk (dir) {
  var listings = fs.readdirSync(dir)
    , files = [];

  listings.forEach(function (listing) {
    var file = path.join(dir, listing)
      , stat = fs.statSync(file);

    if (stat.isFile()) {
      files.push(file);
    } else if (stat.isDirectory()) {
      files = files.concat(walk(file))
    }
  });

  return files;
}

/**
 * Functions to process file contents, identified 
 * by file extension.
 */

var filters = {
  '.jade': function (data, options) {
    var compiler = jade.compile(data);
    return compiler(options.locals || {});
  },
  '.styl': function (data, options) {
    // stylus won't work out of the box
    // filters need to be syncronous
    var styles;
    stylus.render(data, options, function (err, css) {
      styles = css;
    });
    return styles;
  }
};

/**
 * Map of file extensions for use in compilation
 */

var extensions = {
  '.jade': '.html',
  '.styl': '.css'
};

/**
 * Loaders are named plural for lookup, 
 * but they operate on one file at a time. 
 *
 * A call to load will select a loader to use
 * based on options.type
 */

var loaders = {
  default: function (obj, file, options) {
    var data = fs.readFileSync(file).toString()
      , filter = filters[path.extname(file)]
      , nodes = file.split('/')
      , leaf = nodes.pop();

    nodes.forEach(function (node) {
      if (!obj[node]) obj[node] = {};
      obj = obj[node];
    });

    if (options.type === 'modules') {
      leaf = leaf.replace(path.extname(leaf), '');
    }

    if (filter) {
      data = filter(data, options || {}); 
    }

    obj[leaf] = data;
  },

  attachments: function (obj, file, options) {
    var data = fs.readFileSync(file)
      , oldext = path.extname(file)
      , newext = extensions[oldext]
      , filter = filters[oldext]
      , property = (newext) ? file.replace(oldext, newext) : file;

    if (filter) {
      // filters have to be syncronous
      // stylus won't work out of the box
      filtered = filter(data.toString('utf8'), options || {});
      if (!!filtered) data = new Buffer(filtered);
    }

    obj._attachments[property] = {
      content_type: mime.lookup(property),
      data: data.toString('base64')
    };
  },

  json: function (obj, file, options) {
    var data = fs.readFileSync(file).toString()
      , json = JSON.parse(data)
      , nodes = file.split('/')
      , leaf = nodes.pop();

    nodes.forEach(function (node) {
      if (!obj[node]) obj[node] = {};
      obj = obj[node];
    });

    leaf = leaf.replace(path.extname(leaf), '');
    obj[leaf] = json;
  }
};

/**
 * This is the load method. Extend an object with
 * this to load filesystem contents into the object.
 *
 * Examples:
 *
 * var load = require('./load');
 *
 * var DDoc = Doc.extend({
 *   initialize: function () { this._attachments = {} }
 *   load: load
 * });
 *
 * var ddoc = new DDoc();
 *
 * ddoc.load('./_attachments');
 */

module.exports = function (dir, options) {
  var doc = this
    , options = expand(dir, options)
    , loader = loaders[options.type] 
            || loaders['default'];

  try {
    process.chdir(options.base);

    walk(options.dir).forEach(function (file) {
      loader(doc, file, options);
    });

    process.chdir(options.root);
  } catch (err) {
    console.log('ERROR: ' + err.message);
    console.dir(err.stack); 
    console.log('OPTIONS: ');
    console.dir(options);
    return err;
  } finally {
    process.chdir(options.root);
  }
};

/**
 * These functions are exported for testing. 
 * Not intended to be used directly.
 */

module.exports.type = type;
module.exports.expand = expand;
module.exports.walk = walk;
module.exports.loaders = loaders;

/**
 * These are exported for testing and so they 
 * can potentially be extended by users.
 */

module.exports.filters = filters;
module.exports.extensions = extensions;
