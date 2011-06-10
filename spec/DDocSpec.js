var DDoc = require('../lib/ddoc.js')
  , fs = require('fs');

describe('DDoc', function () {
  var ddoc, fn, obj;

  beforeEach(function () {
    ddoc = new DDoc('id');  
  });

  it('should initialize _id', function() {
    expect(ddoc._id).toEqual('_design/id');
  });
  
  it('should initialize views, lists, shows, and schemas to {}', function() {
    ['views', 'lists', 'shows', 'schemas'].forEach(function (prop) {
      expect(ddoc[prop]).toEqual({});
    });
  });
  
  it('should initialize rewrites to []', function() {
    expect(ddoc.rewrites).toEqual([]);
  });

  it('should have a revision property if it has been pushed');


  describe('revision method', function() {
    var rev_json, rev_file;

    beforeEach(function() {
      rev_json = { "ok": "true", "id": "_design/id", "rev": "1-12345" };
      rev_file = new Buffer(JSON.stringify(rev_json));

      spyOn(fs, 'readdirSync').andCallFake(function () { return ['rev.json'] });
      spyOn(fs, 'readFileSync').andCallFake(function () { return rev_file; });

      ddoc.revision();
    });
    
    it('should add a revision property to ddoc', function() {
      expect(ddoc._rev).toEqual('1-12345');
    });
  });  


  describe('strfn method', function() {
    var raw;

    beforeEach(function() {
      fn = function () {}
      raw = {
        a: fn,
        b: { c: fn },
        d: [fn, fn]
      };
      obj = ddoc.strfn(raw);
    });
    
    it('should convert functions in an object to strings', function() {
      [obj.a, obj.b.c, obj.d[0], obj.d[1]].forEach(function (f) {
        expect(f).toEqual(fn.toString());
      });
    });
  });  
  

  describe('view method', function() {
    beforeEach(function() {
      obj = { 
        map: function (doc) {},
        reduce: function (key, values, rereduce) {}
      };
      ddoc.view('foo', obj);
    });
    
    it('should add a property to ddoc.views', function() {
      expect(ddoc.views.foo).toBeDefined();
    });

    it('should require a valid view object');
    
    it('should represent functions in the view object as strings', function () {
      expect(ddoc.views.foo.map).toEqual(obj.map.toString());
      expect(ddoc.views.foo.reduce).toEqual(obj.reduce.toString());
    });
  });  
  
  
  describe('list method', function() {
    beforeEach(function() {
      fn = function (head, req) {};
      ddoc.list('foo', fn);
    });
    
    it('should add a property to ddoc.lists', function() {
      expect(ddoc.lists.foo).toBeDefined();
    });
    
    it('should represent a function as a string', function() {
      expect(typeof ddoc.lists.foo).toEqual('string');
      expect(ddoc.lists.foo).toEqual(fn.toString());
    });

    it('should validate the argument signature');
  });  
  

  describe('show method', function() {
    beforeEach(function() {
      fn = function (doc, req) {};
      ddoc.show('foo', fn);
    });

    // both the source and the tests have duplication. 
    // is it worth eliminating in either or both?

    it('should add a property to ddoc.shows', function() {
      expect(ddoc.shows.foo).toBeDefined();
    });

    it('should represent a function as a string', function() {
      expect(typeof ddoc.shows.foo).toEqual('string');
      expect(ddoc.shows.foo).toEqual(fn.toString());
    });
  });  
  

  describe('schema method', function() {
    var schema;

    beforeEach(function() {
      schema = { 
        type: 'object',
        properties: {
          prop: { type: 'string' }
        }
      };
      ddoc.schema('foo', schema);
    });
    
    it('should add a property to ddoc.schemas', function() {
      expect(ddoc.schemas.foo).toBeDefined();
    });

    it('should validate obj against json-schema meta-schema');
  });  


  describe('validation method', function() {
    beforeEach(function() {
      fn = function (doc) {};
      ddoc.validation(fn);
    });
    
    it('should set ddoc.validate_doc_update', function() {
      expect(ddoc.validate_doc_update).toBeDefined();
    });
    
    it('should represent a function as a string', function() {
      expect(typeof ddoc.validate_doc_update).toEqual('string');
      expect(ddoc.validate_doc_update).toEqual(fn.toString());
    });
  });  
  

  describe('rewrite method', function() {
    var rule; 

    beforeEach(function() {
      rule = {
        from: '/',
        to: 'index.html',
        method: 'GET',
        query: {}
      };
      ddoc.rewrite(rule);
    });
    
    it('should add a rule to ddoc.rewrites', function() {
      expect(ddoc.rewrites[0]).toEqual(rule);
    });
  });  
  
  describe('load method', function() {
    var directories, files;

    beforeEach(function() {

      mockfs = {
        'dir': {
          'file1.js': 'Contents of file1.js',
          'subdir': {
            'file2.js': 'Contents of file2.js'
          }
        }
      }

      function traverse (pth, dir) {
        var nodes = pth.split('/')
          , current = nodes.shift();

        if (nodes.length == 0) { 
          return dir[current]; 
        } else { 
          return traverse(nodes.join('/'), dir[current]); 
        }
      }

      function readdirSync(pth) {
        var directory = traverse(pth, mockfs)
          , listings = [];

        for (listing in directory) {
          listings.push(listing);
        }

        return listings;
      }

      function statSync(pth) {
        var directory = traverse(pth, mockfs);
        return (function (dir) {
          return {
            isFile: function () {
              return (typeof dir == 'string');
            },
            isDirectory: function () {
              return (typeof dir == 'object' && !!dir);
            }
          }
        })(directory);
      }

      function readFileSync (pth) {
        var file = traverse(pth, mockfs);
        return new Buffer(file);
      }
      
      spyOn(fs, 'readdirSync').andCallFake(readdirSync);

      spyOn(fs, 'statSync').andCallFake(statSync);

      spyOn(fs, 'readFileSync').andCallFake(readFileSync);

      ddoc.load('dir');
    });

    it('should add filesystem contents to ddoc', function () {
      expect(ddoc.dir).toEqual({ 
        file1: 'Contents of file1.js', 
        subdir: {
          file2: 'Contents of file2.js'
       }  
      });
      
    });
    
    it('should render jade to html');
    it('should render stylus to css');
  });  

  /*
  describe('validate method', function() {
    it('should validate ddoc against a schema')
  });  
  */

});