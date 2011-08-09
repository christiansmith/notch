# Notch (Node on the Couch)

Notch is a command line tool and library for building, deploying and administering CouchApps with Node.js. 

## Install

You need Node.js, npm and of course CouchDB (preferably >= 1.1) installed first.

To use Notch as an executable, first install it globally:

    $ npm install -g notch

Then install locally as a project dependency:

    $ npm install notch

To hack Notch, first get the source:

    $ git clone git://github.com/christiansmith/notch
    $ cd notch
    $ npm link

Then link notch into your project:

    $ notch init -d path/to/project
    $ cd path/to/project
    $ npm link notch

## CLI Usage

    $ notch [command] [args] [options]

Commands:

    init [-d directory] [-s skeleton]

      Copies a default or optional skeleton from ~/.notch/closet into the
      current or optional directory. Create your own project skeletons and
      add them to the closet. Running init without specifying a directory 
      or skeleton will result in the default skeleton being copied into the 
      current directory.

    push [ddoc] [-t target]

      Deploy a named CouchApp to a CouchDB target. The ddoc argument is optional.
      If there is more than one DDoc in your project, you can specify a default
      in config.json. If there is only one app in your project, it is the default.

      $ notch push -t production

    draft <file> [-m model]

      Generate a new json document and save it to a file. If a model is
      specified, draft will prompt you to use defaults from a json-schema 
      or walk through the schema properties.

    publish <file> [-t target] [-m model]

      PUT a json document in a file to the server. By default, nothc keeps
      these documents in a directory called data. The document _id and _rev
      from the server response are saved along with timestamps.

    fetch <id> [-t target] [-m model]

      GET a document from a target server and write it to a file.

    retract <file> [-t target] [-m model]

      DEL a document from a target, but not the file. _id and _rev are removed.

Options

    -h  help
    -v  version
    -d  directory
    -s  skeleton
    -m  model
    -t  target


## Tutorial

Initialize an app:

    $ notch init -d myapp
    $ cd myapp

Edit config.json to point to your database:

    {
      "targets": {
        "development": {
          "url": "http://localhost:5984/db",
          "auth": "user:pwd"
        } 
      },
      "models": "lib/models.js"
    }


Add some code to ddoc.js (see API description below):

    ddoc.view('tagged', {
      map: function (doc) {
        if (doc.type == 'post' && doc.tags) {
          doc.tags.forEach(function (tag) {
            emit([tag, doc.published_at], doc);
          });
        }
      }
    });

Push it to your database:

    $ notch push app

Now lets put some data in there:

    $ notch draft newdoc

This generates data/newdoc.json. Add some valid JSON and then put it on the server:

    $ notch publish data/newdoc.json

The complete features of notch aren''t all covered here. The project is in active development and everything is subject to change.


## Project Structure

The default Notch project structure looks something like this:

    _attachments/
    config.json
    data/
    ddoc.js

You can also manage multiple apps per project, like so:

    config.json
    apps/blog/_attachments/
    apps/blog/ddoc.js
    apps/blog/lib
    ...
    apps/admin/_attachments/
    apps/admin/ddic.js
    ...
    etc.


## API description

Doc is the foundational abstraction of Notch. Doc has static methods to read from the filesystem, get from the server, and spawn from a schema. Doc can also be extended.

    Doc.read('file.json');
    Doc.get(id, target, callback);
    Doc.spawn(schema);
    Doc.extend(proto, static);

Doc instances can be initialized from an object. 

    var doc = new Doc({ foo: 'bar' });

Once initialized, an instance can read from a file, validate itself against a json-schema, generate a url for itself from a target object, write to a file, or put/del to a server. Of course, an extended Doc can override any or all of this.

    doc.read('file.json', ['prop1','prop2']); // leave off the second arg to get everything

    doc.validate(schema);

    doc.url(target);

    doc.write(file);

    doc.put(target, function (err, res, body) { ... });

    doc.del(target, function (err, res, body) { ... });


DDoc extends Doc to make it easy to build design documents. Here''s an example:

    var notch = require('notch')
      , ddoc = notch.createDDoc('blog');

    // load some external stuff into the app
    ddoc.load('_attachments');
    ddoc.load({ json: 'schemas' });
    ddoc.load({ json: 'info.json' });
    ddoc.load({ modules: 'lib' });
    ddoc.load({ modules: 'vendor' });
    ddoc.load({ modules: 'templates', locals: ddoc.info });

    // add some rewrites
    ddoc.rewrite({
      from: '/posts/tagged/:tag',
      to: '_list/posts/tagged',
      query: {
        startkey: [':tag', {}],
        endkey: [':tag'],
        descending: 'true',
        limit: (ddoc.info.pagesize + 1).toString()
      }
    });

    // validation
    ddoc.validate(function (newDoc, oldDoc, userCtx) {
      var validate = require('vendor/json-schema').validate
        , schema = this.schemas[newDoc.type];
      
      if (!userCtx.name) {
        throw { forbidden: 'Please log in first' };
      }
      
      if (oldDoc && newDoc.type !== oldDoc.type) {
        throw { forbidden: 'Can\'t change document type' };
      }
      
      if (schema) {
        var report = validate(newDoc, schema);
        if (!report.valid) {
          throw { forbidden: report };
        }
      }
    });

    // add a view
    ddoc.view('tagged', {
      map: function (doc) {
        // ...
      } 
    });

Similarly, 

    ddoc.show('name', function (doc, req) {...});
    ddoc.list('name', function (head, req) {...});


You can extend Doc or DDoc if you want. For an example of this,
see [Hekyll](http://github.com/christiansmith/hekyll).
    

## License

Copyright (c) 2011 Christian Smith
MIT License

## Contact

Message me on GitHub.

## Known Issues

Notch is a work in progress. Use it at your own risk. I would love to find a few collaborators to work on notch or jump into a similar effort.  

## Credit and Acknowledgements

Inspired by couchapp, node.couchapp.js, soca, and a very long list of tools I've found useful, like npm, git, leiningen, sinatra and countless others... 
