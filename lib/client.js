/**
 * Module dependencies
 */

var Doc = require('./doc')
  , prompt = require('prompt')
  , child_process = require('child_process')
  , path = require('path')
  , fs = require('fs')
  , df = require('dateformat');

/**
 * Initialize the environment
 */

var env;

/**
 * Client object constructor
 */

function Client (environment) {
  this.env = env = environment;
}

module.exports = Client;

/**
 * Publish a json file to a server and add or 
 * update _id and _rev in the file.
 */

Client.prototype.publish = function(file, options) {
  var filepath = path.resolve(process.cwd(), file);

  if (path.existsSync(filepath)) {     

    var Model = env.getModel(options.model);

    if (Model) {
      var doc = Model.read(filepath);
    } else {
      var json = JSON.parse(fs.readFileSync(filepath, 'utf8'))
        , doc = new (env.getModel(json.type) || Doc)(json);
    }

    env.getTarget(options.target, function (err, target) {
      // set the dates here
      var date = df(new Date(), 'yyyy m d H M s').split(' ').map(function (n) {
        return parseInt(n, 10);  
      });

      if (!doc.published_at) doc.published_at = date;
      doc.updated_at = date;
      
      doc.put(target, function (err, res, body) {
        console.log(body);
        if (res.statusCode == 201) {
          var body = JSON.parse(body);
          doc._id = body.id;
          doc._rev = body.rev;
          doc.write(filepath);
        }
      });
    });
  } else {
    console.log('File not found');
  }
};

/**
 * Fetch a json doc from a server and write its body 
 * to a file.
 */

Client.prototype.fetch = function(id, options) {
  env.getTarget(options.target, function (err, target) {
    Doc.get(id, target, function (err, res, body) {
      var doc = JSON.parse(body)
        , model = env.getModel(doc.type) || Doc
        , file = options.file || path.join(env.root, 'data', doc.type, doc._id + '.json');

      console.log(doc);
      if (res.statusCode == 200) {
        doc = new model(doc);
        doc.write(file); 
        console.log('wrote ' + id + ' to ' + file);
      }
    });
  });
};

/**
 * Remove a json doc from a server and remove identifier
 * properties from the file
 */

Client.prototype.retract = function(file, options) {
  var filepath = path.resolve(env.root, file); 

  if (path.existsSync(filepath)) {
    env.getTarget(options.target, function (err, target) {
      var Model = env.getModel(options.model)
        , doc = (Model || Doc).read(filepath);

      doc.del(target, function (err, res, body) {
        console.log(body);
        if (res.statusCode == 200) {
          delete doc._id;
          delete doc._rev;
          doc.write(filepath);
        }
      });
    });
  } else {
    console.log('File not found');
  }
};

/**
 * Push a ddoc to a server
 */

Client.prototype.push = function(app, options) {
  if (arguments.length === 1) {
    options = app;
    app = undefined;
  }

  var ddoc = env.getDDoc(app);
  
  if (ddoc) {
    env.getTarget(options.target, function (err, target) {
      ddoc.put(target, function (err, res, body) {
        console.log(body);
        if (res.statusCode == 201) {
          body = JSON.parse(body);
          ddoc._rev = body.rev;
          ddoc.write(ddoc.filepath());
        }
      });
    });
  } else {
    console.log(app + ' is not a known design document');
  }
};



/**
 * Info
 */

var help = ''
  + '\n'
  + '  Usage: notch [command] [args]\n'
  + '         notch [command] [-h | --help]'
  + '\n'
  + '  Commands:\n'
  + '    init                 generate a notch project from a skeleton\n'
  + '    push                 deploy a CouchApp in the project to a target\n'
  + '    draft                generate a new document in a file\n'
  + '    publish              publish the contents of a file to a CouchDB target\n'
  + '    fetch                fetch a document from a deployed CouchApp into a file\n'
  + '    retract              remove a document from a CouchDB database, keeping the file\n'
  + '\n'
  + '  Options:\n'
  + '    -d, --directory      specify a directory to init\n'
  + '    -s, --skeleton       specify a skeleton to init\n'
  + '    -t, --target         specify the name of a configured CouchDB target\n'
  + '    -m, --model          specify a model other than the default or Doc\n'
  + '    -f, --file           specfiy a file path to read from or write to\n'
  + '    -h, --help           show usage\n'
  + '    -v, --version        show version\n'
  + '\n';



Client.prototype.info = function (command, options) {
  if (options.version) {
    console.log('0.0.0');
  } else {
    console.log(help);
  }
};


/**
 * Init
 */

Client.prototype.init = function(options) {
  var source = env.closet[options.skeleton || 'default']
    , target = options.directory || env.root
    , command = 'cp -R ' + source + ' ' + target;

  // note that target defined above has a different meaning 
  // than target used throughout the rest of notch. Should probably
  // rename it.

  // verify skeleton exists
  if (!source) {
    return console.log('There is no ' + options.skeleton + ' skeleton in your closet.');
  }

  function _init () {
    child_process.exec(command, function (err, stdout, stderr) {
      (stderr) 
        ? console.log(stderr)
        : console.log('Created a new project from ' + source + ' in ' + target);
      // should we log a manifest of items copied/generated/overwritten?
    });
  }

  if (path.existsSync(target) && fs.readdirSync(target).length !== 0) {
    prompt.start();
    prompt.get({ 
      message: 'The directory is not empty. Do you want to continue?', 
      name: 'confirmation' 
    }, 
    function (err, result) {
      (result.confirmation == 'yes')
        ? _init()
        : console.log('Init aborted.');
    });
  } else {
    _init();
  } 

  
};

/**
 * Draft a document to a file from a schema.
 */

Client.prototype.draft = function(file, options) {
  var model = env.getModel(options.model) || Doc;

  if (!options.file) {
    var subdir = options.model || env.config.defaults.model;
    if (path.dirname(file) == '.') file = path.join('data', subdir, file);
    if (path.extname(file) == '') file += '.json';
  } else {
    file = options.file;
  }

  function _draft () {
    var message = 'Wrote a new '
                + (options.model || 'document')
                + ' to ' + file;

    if (!options.model) {
      var doc = model.spawn();
      doc.write(file);
      console.log(message);
    } else {
      var useDefaults = {
        message: 'Use defaults for ' + options.model + '?',
        name: 'useDefaults',
        validator: /(yes|no?)/,
        default: 'yes'
      }; 
      prompt.start();
      prompt.get(useDefaults, function (err, result) {
        if (result.useDefaults == 'yes') {
          var doc = model.spawn();
          doc.write(file);
          console.log(message);

        } else {

          function fromSchema (schema) {
            var keys = Object.keys(schema.properties)
              , props = [];

            keys.forEach(function (key) {
              var prop = schema.properties[key];
              if (prop.default || prop.default == '') {
                props.push({
                  name: key,
                  default: prop.default
                });
              }
            });

            return props;
          }

          prompt.get(fromSchema(model.schema), function (err, result) {
            var doc = new model(result);
            doc.write(file);
            console.log(message);
          });
        }
      });
    }
  }

  if (path.existsSync(file)) {
    prompt.start();
    prompt.get({
        message: 'The file you specified already exists. Do you want to overwrite it?',
        name: 'confirmation'
      },
      function (err, result) {
        (result.confirmation == 'yes')
          ? _draft()
          : console.log('Draft aborted.');
      });
  } else {
    _draft();
  }
};
