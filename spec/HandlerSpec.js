var handler = require('../lib/handler')
  , fs = require('fs');

describe('ResponseHandler', function() {

  beforeEach(function() {
    err = null;

    res201 = { statusCode: 201 };
    res409 = { statusCode: 409 };

    body201 = { ok: true, id: 'abcdef', rev: '1-12345' };
    body409 = {"error":"conflict","reason":"Document update conflict."}
  });
  
  describe('push', function() {
    beforeEach(function() {
      spyOn(console, 'log').andCallFake(function () {});
      spyOn(fs, 'writeFileSync').andCallFake(function () {});
    });
    
    it('should log 201 response body', function () {
      handler.push(err, res201, body201);  
      expect(console.log).toHaveBeenCalledWith(body201);
    });

    it('should write 201 response to rev.json', function () {
      handler.push(err, res201, body201);  
      expect(fs.writeFileSync)
        .toHaveBeenCalledWith('rev.json', 
                              JSON.stringify(body201, null, 2));
    });

    it('should log 409 response body', function () {
      handler.push(err, res409, body409);
      expect(console.log).toHaveBeenCalledWith(body409);
    });

    /*
    it('should update history');
    it('should record revision');
    it('should log action');
    it('should log result');
    */
  });  
});  
