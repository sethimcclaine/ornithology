var EventSource = require('eventsource')
    request = require('request');

module.exports = function(config) {
  var messageStatus = 'on';

  this.postMessage = function(message) {
      if (messageStatus === 'snooze' || messageStatus === 'off') {
          console.log('Messages are currently ' + messageStatus);
          return;
      }

      var postUrl = 'https://'+config.cred+':'+config.pass+'@api.flowdock.com//flows/'+config.org+'/'+config.flow+'/messages';

      var options = {
          method: 'POST',
          url: postUrl,
          qs: {
              content: message,
              event: 'message'
          },
          headers: {
              'postman-token': '565ef014-b85a-14b8-69c8-29a393241cec',
              'cache-control': 'no-cache'
          }
      };

      request(options, function (error, response, body) {
          if (error) {
            throw new Error(error);
          } else {
            console.log('::Message Sent::');
          }
      });
  };

  this.observeFlow = function(callback) {
      var streamUrl = 'https://' + config.cred + ':' + config.pass + '@stream.flowdock.com/flows?filter=' + config.org + '/' + config.flow;
      var jsonStream = new EventSource(streamUrl);

      jsonStream.onmessage = function (e) {
        callback(JSON.parse(e.data));
      };
  };
};
