var DDoc = require('../../lib/ddoc')
  , Doc = require('../../lib/doc')

var Post = Doc.extend(null, {
  schema: {
    properties: {
      title: { type: 'string', default: '' }
    }
  } 
});

module.exports = {
  targets: {
    dev: { 
      url: 'http://localhost:5984/dev', 
      default: true     
    },
    prod: {
      url: 'http://notch.couchone.com/prod',
      auth: 'user:password'
    }
  },
  ddocs: {
    blog: new DDoc('blog')
  },
  models: {
    post: Post
  },
  skeletons: {
    default: '/path/to/default/',
    custom: '/path/to/custom/'
  }
};

