var Client = require('../lib/client')
  , Env = require('../lib/env')
  , config = require('./shared/config')
  , Doc = require('../lib/doc')
  , DDoc = require('../lib/ddoc')
  , child_process = require('child_process')
  , path = require('path')
  , fs = require('fs');


describe('Client', function() {

  beforeEach(function() {
    env = new Env(config);
    client = new Client(env);  
  });

  describe('env', function() {
    it('should be defined', function () {
      expect(client.env).toBeDefined();  
    });

    it('should be an instance of Env', function () {
      expect(client.env instanceof Env).toBeTruthy();
    });
  });  

  describe('init', function() {
    beforeEach(function() {
      init = function (options) {
        runs(function () {
          spyOn(console, 'log');
          spyOn(child_process, 'exec').andCallFake(function (command, callback){
            callback();  
          });
          client.init(options);
        });
        waits(10);
        runs(function () {
          command = child_process.exec.mostRecentCall.args[0];
        });
      };
    });
    
    it('should copy a default skeleton if not specified', function() {
      init({});
      runs(function () {
        expect(command).toContain('/path/to/default/');
      });
    });
    
    it('should copy to current directory if not specified', function() {
      init({});
      runs(function () {
        expect(command).toContain(env.root);
      })
    });
    
    it('should copy a custom skeleton if specified', function() {
      init({ skeleton: 'custom' });
      runs(function () {
        expect(command).toContain('/path/to/custom/');
      });
    });
    
    it('should copy to a specified directory', function() {
      init({ directory: '/path/to/project' });
      runs(function () {
        expect(command).toContain('/path/to/project');
      });
    });

    it('should log success', function () {
      init({ skeleton: 'custom', directory: '/path/to/project'});
      runs(function () {
        message = console.log.mostRecentCall.args[0];
        expect(message).toContain('Created a new project');
        expect(message).toContain('/path/to/custom/');
        expect(message).toContain('/path/to/project');
      });
    });
  });  
  

  describe('publish 201', function() {
    beforeEach(function () {
      runs(function () {
        draft = JSON.stringify({ foo: 'bar' });
        spyOn(console, 'log');
        spyOn(path, 'existsSync').andReturn(true);
        spyOn(fs, 'readFileSync').andCallFake(function () { return draft; });
        spyOn(fs, 'writeFileSync');
        spyOn(Doc, 'request').andCallFake(function (options, callback) {
          callback(null, {statusCode:201}, JSON.stringify({
            ok: true,
            id: 'uuid-12345',
            rev: '1-12345'
          }));
        });
        client.publish('data/foo.json', { target: 'dev' });
      });
      waits(10);
    });

    it('should add doc _id and _rev to a file', function() {
      runs(function () {
        var written = fs.writeFileSync.mostRecentCall.args[1];
        expect(written).toContain('"_id": "uuid-12345"');
        expect(written).toContain('"_rev": "1-12345"');
      });
    });
    
    it('should log server response', function() {
      runs(function () {
        expect(console.log.mostRecentCall.args[0]).toContain('"ok":true');
      });
    });
  });  
  

  describe('fetch 200', function() {
    beforeEach(function() {
      runs(function () {
        spyOn(fs, 'writeFileSync');
        spyOn(console, 'log');
        spyOn(Doc, 'request').andCallFake(function (options, callback) {
          var body = JSON.stringify({
            _id: 'uuid-12345',
            _rev: '1-12345',
            foo: 'bar'
          });
          callback(null, {statusCode:200}, body);
        });
      });
    });
    
    it('should write response to file', function() {
      runs(function () {
        client.fetch('uuid-12345', { target: 'dev' });
      });
      waits(10);
      runs(function () {
        var written = fs.writeFileSync.mostRecentCall.args[1];
        expect(written).toContain('"_id": "uuid-12345"');
        expect(written).toContain('"_rev": "1-12345"');
        expect(written).toContain('"foo": "bar"');
      });
      
    });
    
    it('should write to default file', function() {
      runs(function () {
        client.fetch('uuid-12345', { target: 'dev' });
      });
      waits(10);
      runs(function () {
        var file = fs.writeFileSync.mostRecentCall.args[0];
        expect(file).toContain('data/uuid-12345.json');
      });
    });

    it('should write to a specified file', function() {
      runs(function () {
        client.fetch('uuid-12345', { target: 'dev', file: 'path/to/file.json' });
      });
      waits(10);
      runs(function () {
        var file = fs.writeFileSync.mostRecentCall.args[0];
        expect(file).toContain('path/to/file.json');
      });
    });
    
    // expect confirm if the file already exists
    // expect logs to have been written
  });  
  
  describe('retract 200', function() {
    beforeEach(function() {
      runs(function () {
        json = JSON.stringify({
          _id: 'uuid-12345',
          _rev: '1-12345',
          foo: 'bar'
        });
        spyOn(path, 'existsSync').andReturn(true);
        spyOn(fs, 'readFileSync').andReturn(json);
        spyOn(fs, 'writeFileSync');
        spyOn(console, 'log');
        spyOn(Doc, 'request').andCallFake(function (options, callback) {
          callback(null, {statusCode:200}, JSON.stringify({
            ok: true
          }));
        });
      });
    });

    it('should remove _id and _rev from file', function() {
      runs(function () {
        client.retract('data/file.json', { target: 'dev' });
      });
      waits(100);
      runs(function () {
        var written = fs.writeFileSync.mostRecentCall.args[1];
        expect(written).not.toContain('uuid-12345');
        expect(written).not.toContain('1-12345');
        expect(written).toContain('"foo": "bar"');
      });
    });
    
    // expect logs to have been written
  });  

  
  describe('publish and retract', function() {
    beforeEach(function() {
      spyOn(console, 'log');
    });
    
    it('should log file not found to console', function() {
      ['publish', 'retract'].forEach(function (method) {
        client[method]('notafile');
        expect(console.log).toHaveBeenCalledWith('File not found');
      });
    });
  });  


  describe('push 201', function() {
    beforeEach(function () {
      runs(function () {
        spyOn(console, 'log');
        spyOn(fs, 'writeFileSync');
        spyOn(Doc, 'request').andCallFake(function (options, callback) {
          callback(null, {statusCode:201}, JSON.stringify({
            ok: true,
            id: '_design/blog',
            rev: '1-12345'
          }));
        });
        client.push('blog', { target: 'dev' });
      });
      waits(10);
    });

    // expect response to be logged

    it('should write ddoc json to a file after push', function() {
      runs(function () {
        var written = fs.writeFileSync.mostRecentCall.args[1];
        expect(written).toContain('"_id": "_design/blog"');
        expect(written).toContain('"_rev": "1-12345"');
        expect(written).toContain('"shows": {}');
      });
    });
  });  
  
  describe('push', function() {
    beforeEach(function() {
      spyOn(console, 'log');
      spyOn(Doc, 'request');
      client.push('foo', {});
    });

    it('should log unknown design document', function() {
      expect(console.log).toHaveBeenCalledWith('foo is not a known design document');
    });
  });  
  

});
