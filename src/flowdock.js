let EventSource = require('eventsource'),
    request = require('request');

module.exports = function({cred, pass, org, flow}) {
  let jsonStream = { onmessage: null },
      handleMessage = null;

  /**
   * Remove the onmessage handler from the current jsonStream
   * Then replace the current jsonStream with a new one, and attaching a new
   * onmessage handler
   */
  let setJsonStream = () => {
      let streamUrl = 'https://' + cred + ':' + pass + '@stream.flowdock.com/flows?filter=' + org + '/' + flow;
      jsonStream.onmessage = null;
      jsonStream = new EventSource(streamUrl);

      jsonStream.onmessage = (e) => {
        handleMessage(JSON.parse(e.data));
      };
  };

  /**
   * Post the given message to the flow specified in the config
   * @param {string} message
   */
  let postMessage = function(message) {
      let postUrl = 'https://'+cred+':'+pass+'@api.flowdock.com//flows/'+org+'/'+flow+'/messages',
          options = {
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
  /**
   * Sets up a jsonStream to the flow specified in the config
   * Every 60 minutes kills the current stream and starts a new one to prevent
   * timing out
   * @param {obj} callback function to be called when a message is retreived
   */
  let observeFlow = function(callback) {
      handleMessage = callback;
      setJsonStream();
      setInterval(setJsonStream, 60*60*1000);
  };
  this.postMessage = postMessage;
  this.observeFlow = observeFlow;
};
