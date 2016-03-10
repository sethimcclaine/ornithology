var request = require('request');

var URLS = {
  V1: 'http://ocm-canary.f4tech.com/results',
  V2: 'http://ocm-canary.f4tech.com/results-v2'
};

module.exports= {
  runRequest: function(version, callback) {
    request(URLS[version], function(error, response, body) {
      if (!error && response.statusCode == 200) {
        callback(JSON.parse(body), version)
      } else {
          console.log('error processing');
      }
    });
  }
};
