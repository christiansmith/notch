var config = require('../lib/config')
  , fs = require('fs');

describe('config', function() {
  
  describe('load', function() {
    var fake, conf;

    beforeEach(function() {
      fake = JSON.stringify({
        targets: {
          development: {
            url: 'http://localhost:5984/notch',
            auth: 'user:pass'
          }
        }
      });
    
      spyOn(fs, 'readFileSync').andCallFake(function () { return fake; });

      conf = config.load('config.json');
    });
    
    it('should parse json from file', function() {
      expect(typeof conf).toEqual('object');
      expect(conf.targets).toBeDefined();
    });
  });  
});  

