var DDoc = require('../../lib/ddoc')
  , Doc = require('../../lib/doc')

var Post = Doc.extend(null, {
  schema: {
    properties: {
      title: { type: 'string', default: '' },
      author: { type: 'string', default: 'some dude' }
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
    },
    secure: {
      url: 'http://notch.example.com/secure',
      user: 'user'
    }
  },
  ddocs: {
    app: new DDoc('app'),
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

