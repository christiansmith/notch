/**
 * Module dependencies
 */

var Doc = require('./doc')
  , request = require('request')
  , child_process = require('child_process')
  , path = require('path')
  , fs = require('fs');


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
    var json = JSON.parse(fs.readFileSync(filepath, 'utf8'))
      , doc = new (env.getModel(json.type) || Doc)(json)
      , target = env.getTarget(options.target);

    doc.put(target, function (err, res, body) {
      if (res.statusCode == 201) {
        console.log(body);
        var body = JSON.parse(body);
        doc._id = body.id;
        doc._rev = body.rev;
        doc.write(filepath);
      }
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
  var target = env.getTarget(options.target);
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
};

/**
 * Remove a json doc from a server and remove identifier
 * properties from the file
 */

Client.prototype.retract = function(file, options) {
  var filepath = path.resolve(env.root, file); // should be using env.root

  if (path.existsSync(filepath)) {
    var target = env.getTarget(options.target)
      , doc = Doc.read(file);
    doc.del(target, function (err, res, body) {
      console.log(body);
      if (res.statusCode == 200) {
        delete doc._id;
        delete doc._rev;
        doc.write(file);
      }
    });
  } else {
    console.log('File not found');
  }
};

/**
 * Push a ddoc to a server
 */

Client.prototype.push = function(app, options) {
  var ddoc = env.getDDoc(app)
    , target = env.getTarget(options.target);
  
  if (ddoc) {
    ddoc.put(target, function (err, res, body) {
      console.log(body);
      if (res.statusCode == 201) {
        body = JSON.parse(body);
        ddoc._rev = body.rev;
        ddoc.write(ddoc.filepath());
      }
    });
  } else {
    console.log(app + ' is not a known design document');
  }
};



/**
 * Info
 */

Client.prototype.info = function (command, options) {
  if (options.version) {
    console.log('0.0.0');
  } else {
    console.log('Usage: ' + command);
    console.log('RTFS');
  }
};


/**
 * Init
 */

Client.prototype.init = function(options) {
  var source = env.closet[options.skeleton || 'default']
    , target = options.directory || env.root
    , command = 'cp -R ' + source + ' ' + target;

  // verify source
  // verify target

  child_process.exec(command, function (err, stdout, stderr) {
    console.log('Created a new project from ' + source + ' in ' + target);
    // log a manifest of items copied/generated?
  });
};


/*

// APP RELATED
// $ notch init
Client.prototype.init = function(skeleton, dir) {
  console.log('initializing notch app');

  var source = env.closet[skeleton] // env.closet[options.skeleton || 'default']
    , target = dir || env.root
    , command = 'cp -R ' + source + ' ' + target;

  if (!source) {
    console.log('There is no ' + skeleton + ' skeleton in your closet.');
    return;
  }
  
  if (!path.existsSync(target)) {
    console.log('Bad dir');
    // fs.mkdirSync ?
    // this isn't quite right. 
  }

  exec(command, function (err, stdout, stderr) {
    if (err) console.log('boo hoo!');
    console.log('woo hooo!');
  });
};




// DOC RELATED
// $ notch draft

Client.prototype.draft = function(model, file) {
  var Model = env.getModel(model)
    , doc = Model.spawn();

  doc.write(file);
};


*/

/*
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

*/
