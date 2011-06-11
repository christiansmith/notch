
/**
 * Module dependencies
 */

var fs = require('fs');

/**
 * This module encapsulates request callback functions for 
 * the client module. The purpose of defining the callbacks 
 * separately is to facilitate testing. The purpose of defining 
 * them in a separate module is to keep the Client api clean.
 */

function ResponseHandler () {}
module.exports = new ResponseHandler();

/**
 * Callbacks
 */

ResponseHandler.prototype.push = function(err, res, body) {
  switch(res.statusCode) {
    case 201:
      console.log(body);
      fs.writeFileSync('rev.json', JSON.stringify(body, null, 2));
      break;
    
    default:
      console.log(body);
      // code
  }
};
