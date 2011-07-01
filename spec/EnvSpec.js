var Env = require('../lib/env')
  , Doc = require('../lib/doc')
  , DDoc = require('../lib/ddoc')
  , config = require('./shared/config')
  , fs = require('fs');


describe('Env', function() {
  beforeEach(function() {
    files = {
      '/project/config.json': JSON.stringify({
        targets: config.targets,
        ddocs: { blog: 'ddocs/blog/ddoc.js' },
        models: 'ddocs/blog/models.js'
      }),
      '/project/ddocs/blog/ddoc.js': config.ddocs.blog,
      '/project/ddocs/blog/models.js': config.models
    };

    spyOn(process, 'cwd').andReturn('/project');

    spyOn(fs, 'readFileSync').andCallFake(function (file) {
      return files[file];  
    });

    spyOn(module.constructor, '_load').andCallFake(function (mod) {
      return files[mod];  
    });

    emptyEnv = new Env();
    objEnv = new Env(config);
    fileEnv = new Env('config.json');
    envs = [objEnv, fileEnv];
  });

  describe('initialization', function() {
    it('should create an instance of Env', function () {
      envs.forEach(function (env) {
        expect(env instanceof Env).toBeTruthy();
      });
    });

    it('should set root', function () {
      envs.forEach(function (env) {
        expect(env.root).toEqual('/project');
      });
    });

    it('should set config', function () {
      envs.forEach(function (env) {
        expect(env.config).toBeDefined();
        expect(typeof env.config).toEqual('object');
      });
    });

    it('should load ddocs', function () {
      envs.forEach(function (env) {
        expect(env.ddocs).toBeDefined();
        expect(env.ddocs.blog instanceof DDoc).toBeTruthy();
      });
    });

    /*
    it('should load models', function() {
      envs.forEach(function (env) {
        expect(env.models).toBeDefined();
        expect(env.models.post instanceof Doc).toBeTruthy();
      });
    });
    */

    it('should load skeletons', function () {
      expect(emptyEnv.closet).toBeDefined(); 
    });
  });  
  
  describe('instance', function() {
    it('should access targets', function() {
      envs.forEach(function (env) {
        expect(env.getTarget('dev').url).toContain('localhost');
      });
    });
    
    it('should return a default target', function() {
      expect(env.getTarget().url).toContain('localhost');
    });
    
    
    it('should access ddocs', function () {
      envs.forEach(function (env) {
        expect(env.getDDoc('blog') instanceof DDoc).toBeTruthy();
      });
    });
    
    it('should access models', function() {
      envs.forEach(function (env) {
        expect(env.getModel('post')).toBeDefined();
      });
    });

    it('should access schemas', function () {
      envs.forEach(function (env) {
        expect(env.getSchema('post')).toBeDefined();
        expect(typeof env.getSchema('post')).toEqual('object');
      });
    });
  });  
});  
