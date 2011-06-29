var Doc = require('../lib/doc')
  , http = require('http')
  , fs = require('fs');


describe('Constructor extended from Doc', function() {
  beforeEach(function() {
    Doc.prototype.override = 'change me'
    Doc.override = 'change me';
    EDoc = Doc.extend({
      foo: 'bar',
      override: 'a new value am i'
    }, {
      foo: 'baz',
      override: 'i too am a new value'
    });
    edoc = new EDoc();
  });
  
  it('should be extended from Doc', function  () {
    expect(EDoc.prototype.initialize).toBeDefined();
    expect(EDoc.prototype.constructor).toEqual(EDoc);
    expect(EDoc.superclass).toEqual(Doc.prototype);
    expect(edoc instanceof Doc).toBeTruthy();
  });

  it('should be extendable', function () {
    FDoc = EDoc.extend();
    fdoc = new FDoc();
    expect(fdoc instanceof EDoc).toBeTruthy();
    expect(fdoc instanceof Doc).toBeTruthy();
  });

  it('should have new prototype properties', function () {
    expect(EDoc.prototype.foo).toBeDefined();
  });

  it('should have overridden prototype properties', function () {
    expect(EDoc.prototype.override).toEqual('a new value am i');
  });

  it('should have new static properties', function () {
    expect(EDoc.foo).toBeDefined();
  });

  it('should have overridden static properties', function () {
    expect(EDoc.override).toEqual('i too am a new value');
  });
});  


describe('Doc', function() {
  beforeEach(function() {
    json = { a: 'a', b: 2, c: { d: [] } };
    document = new Doc(json);
  });
  
  it('should return a Document instance', function () {
    expect(document instanceof Doc).toBeTruthy();
  });

  it('should initialize from an object', function () {
    expect(document.a).toBeDefined();
    expect(document.c.d).toEqual([]);
    expect(document.hasOwnProperty('initialize')).not.toBeTruthy();
    expect(document.constructor.prototype.initialize).toBeDefined();
  });


  describe('read', function() {
    beforeEach(function() {
      json = { foo: 'bar' };
      spyOn(fs, 'readFileSync').andReturn(JSON.stringify(json));
      document = Doc.read('doc.json');
    });
    
    it('should initialize an object from a file', function () {
      expect(document.foo).toEqual('bar');
    });

    it('should load attachments?');
  });  

  describe('spawn', function() {
    beforeEach(function() {
      schema = {
        type: 'object',
        properties: {
          a: { type: 'string', default: 'alpha' },
          b: { type: 'object', default: {} },
          c: { type: 'number', default: 3 },
          d: { type: 'array' }
        }
      };
    });
    
    it('should generate a new Doc from a schema argument', function () {
      doc = Doc.spawn(schema);
      expect(doc.a).toEqual('alpha');
      expect(doc.b).toEqual({});
      expect(doc.c).toEqual(3);
      expect(doc.d).not.toBeDefined();
    });

    it('should generate a new Doc from a static schema property', function () {
      EDoc = Doc.extend(null, { schema: schema });
      doc = EDoc.spawn();
      expect(doc.a).toEqual('alpha');
      expect(doc.b).toEqual({});
      expect(doc.c).toEqual(3);
      expect(doc.d).not.toBeDefined();
    });

//    it('should throw an error if schema is undefined', function () {
//      expect(Doc.spawn()).toThrow();
//    });
  });  
});  

describe('Doc instance', function() {
  describe('read method', function() {
    beforeEach(function() {
      doc = new Doc({w: 0, x: 1 });
      json = { x: 'x', y: 2, z: [ 3 ]};
      spyOn(fs, 'readFileSync').andCallFake(function () {
        return JSON.stringify(json);
      });
    });
    
    it('should merge all properties from a file', function () {
      doc.read('some.json');
      expect(doc.w).toEqual(0);
      expect(doc.x).toEqual(json.x);
      expect(doc.y).toEqual(json.y);
      expect(doc.z).toEqual(json.z);
    });

    it('should merge a list of properties from a file', function () {
      doc.read('some.json', 'y');  
      expect(doc.w).toEqual(0);
      expect(doc.x).toEqual(1);
      expect(doc.y).toEqual(json.y);
      expect(doc.z).not.toBeDefined();
    });
  });  
  

  describe('validate method', function() {
    beforeEach(function() {
      EDoc = Doc.extend(null, {
        schema: {
          properties: {
            foo: { type: 'string' }
          }
        } 
      });
      edoc = new EDoc({ foo: 123 });
      report = edoc.validate();
    });
    
    it('should return a validation report', function() {
      expect(report.errors).toBeDefined();
      expect(report.errors[0].message).toEqual('Instance is not a required type');
    });
  });  
  
  describe('valid method', function() {
    beforeEach(function() {
      EDoc = Doc.extend(null, {
        schema: {
          properties: {
            foo: { type: 'string' }
          }
        }  
      });
      edoc = new EDoc({ foo: 123 });
      validity = edoc.valid();
    });
    
    it('should return a boolean value', function() {
      expect(validity).not.toBeTruthy();
      expect(validity).toEqual(false);
    });
  });  
  
  describe('url method', function() {
    beforeEach(function() {
      target = {
        url: 'http://localhost:5984/notch',
        auth: 'user:password'
      };

      doc = new Doc({
        _id: 'uuid-12345',
        _rev: '1-12345',
      });

      url = doc.url(target);
    });
    
    it('should add doc._id to the path', function () {
      expect(url).toContain('/notch/uuid-12345');
    });

    it('should add doc._rev to the querystring', function () {
      expect(url).toContain('?_rev=1-12345');
    });

    it('should add auth to the host', function () {
      expect(url).toContain('user:password@localhost');
    });

    it('should add add rev for delete', function () {
      url = doc.url(target, 'delete');
      expect(url).toContain('?rev=1-12345');
    });
  });  

  describe('directory method', function() {
    // what directory is the doc located in?
    // is there a doc.type?
  });  
  

  describe('filepath method', function() {
    it('should return the default location for the document', function() {
      // if there is an _id, filename should reflect the id?

      // if there is a doc.type
      // doc.dirpath() == PROJECTROOT / data / doc.type / 
      
      // if there is no doc.type
      // doc.dirpath() == PROJECTROOT / data /
      // ddoc.filepath() == PROJECTROOT / data / _design / _id.json
    });
    
  });  
  

  describe('write method', function() {
    beforeEach(function() {
      spyOn(fs, 'writeFileSync').andCallFake(function () {});
      doc = new Doc({ foo: 'bar' });
      doc.write('foo.json');
    });
    
    it('should write to a file', function () {
      expect(fs.writeFileSync)
        .toHaveBeenCalledWith('foo.json', JSON.stringify(doc, null, 2))
    });

    it('should extract attachments and save separately???');
  });  
  
  describe('get', function() {
    beforeEach(function() {
      runs(function () {
        responses = {
          '/db/uuid-12345': JSON.stringify({ _id: 'uuid-12345', _rev: '1-12345' })
        };
        
        json = JSON.stringify({ _id: 'uuid-12345', _rev: '1-12345' });

        server = http.createServer(function (req, res) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(responses[req.url]);
        }).listen(1234);

        target = { url: 'http://localhost:1234/db' };
        
        callback = { 
          fn: function (err, res, body) {} 
        };
        
        spyOn(callback, 'fn');

        Doc.get('uuid-12345', target, callback.fn);
      });
      waits(1000);
    });

    
    it('should get a doc from a target', function () {
      runs(function () {
        expect(callback.fn.mostRecentCall.args[2]).toEqual(json);
      });
   //   expect(doc instanceof Doc).toBeTruthy();
   //   expect(doc._id).toBeDefined();
   //   expect(doc._rev).toBeDefined();
    });    
  });  
  

  it('should put to a couchdb');
  it('should delete from a couchdb');
  it('should revert to a previous version');
});  
