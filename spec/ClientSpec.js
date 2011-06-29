var Client = require('../lib/client')
  , Env = require('../lib/env')
  , config = require('./shared/config')
  , DDoc = require('../lib/ddoc')
  , fs = require('fs');


describe('Client', function() {

  beforeEach(function() {
    env = new Env(config);
    ddoc = new DDoc('app');
    client = new Client(env);  
  });

  describe('env', function() {
    it('should be defined', function () {
      expect(client.env).toBeDefined();  
    });

    it('should be an instance of Environment', function () {
      expect(client.env instanceof Env).toBeTruthy();
    });
  });  

  describe('put', function() {
    beforeEach(function() {
      
    });
    
    it('should look up a ddoc from env', function () {
      
    });
    it('should look up a target from env');
    it('should build params for the request');
    it('should call request with params and a callback');    
  });  
  
  describe('put and del', function() {
    beforeEach(function() {
      spyOn(console, 'log').andCallFake(function () {});
    });
    
    it('should log file not found to console', function() {
      ['put', 'del'].forEach(function (method) {
        client[method]('notafile');
        expect(console.log).toHaveBeenCalledWith('File not found');
      });
    });
  });  
  

  describe('get', function() {
    it('should get from the server and write to a file');
  });  
  
  describe('del', function() {
    it('should delete from the server and update a file');
  });  
});
