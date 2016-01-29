/**
 * --BirdWatch--
 * Check API every 6 amount of seconds 
 * Count the number of missed webhook lags
 * Post a message in flow when count is increased
 
            ___     ___                        
           // ,\/o\/ ,\\                     {o,o} 
          //\__/-^-\__/\\                   ./)_)   {o,o}
         //             \\                    " "  ./)_)
    /^\ /^\ /^\ /^\ /^\ /^\ /^\                      " "
    |X| |X| |X| |X| |X| |X| |X|
 * --Chirp--
 * Listen for messages starting with #ornithology and respond accordingly
 * options:
 *  - `#ornithology help`
 *  - `#ornithology pause`
 *  - `#ornithology on`
 *  - `#ornithology off`
 
 * @author Seth M.
 */

var config = require('./config.js');
console.log(config);

var EventSource = require('eventsource'),
    request = require('request'),
    lastCount = {
        V1: 100,
        V2: 100
    },
    urls = {
        V1: 'http://ocm-canary.f4tech.com/results',
        V2: 'http://ocm-canary.f4tech.com/results-v2'
    };
var messageStatus = 'on';

var parseResponse = function(body, version) {
    var missing = [],
        hooks = body['webhooks-data'];

    for(var i in hooks) {
        if (!hooks[i]['webhook-t']) {
            missing.push(hooks[i]);
        }
    }

    if (missing.length > 2) {
        console.log(version + ' Missing Webhook Calls: '+missing.length);

        if(missing.length > lastCount[version]) {
            missing.reverse();
            var message = version+' Missing Webhook Calls (#spotw)' +
                    '\nCurrent:'+missing.length +
                    '\nPrevious:'+lastCount[version] +
                    '\nLast: '+missing[0].desc;

            if(messageStatus === 'snooze' || messageStatus === 'off') {
                console.log('Messages are currently '+messageStatus);
            } else {
                postMessage(message);
            }
        }
    } else {
        console.log(version+' hooks are clean');
    }

    lastCount[version] = missing.length;
};

var processRequestV1 = function(error, response, body) {
    if(!error && response.statusCode == 200) {
        parseResponse(JSON.parse(body), 'V1');
    } else {
        console.log('error processing');
    }
};
var processRequestV2 = function(error, response, body) {
    if(!error && response.statusCode == 200) {
        parseResponse(JSON.parse(body), 'V2');
    } else {
        console.log('error processing');
    }
};
var checkStatus = function() {
        request(urls['V1'], processRequestV1);
        request(urls['V2'], processRequestV2);
};

var postMessage = function(message) {
    console.log('posting message');
    var options = {
        method: 'POST',
        url: 'https://'+config.cred+':'+config.pass+'@api.flowdock.com//flows/'+config.org+'/'+config.flow+'/messages',
        qs: {
            content: message,
            event: 'message'
        },
        headers: {
            'postman-token': '565ef014-b85a-14b8-69c8-29a393241cec',
            'cache-control': 'no-cache'
        }
    };

    request(options, function(error, response, body) {
        if (error) throw new Error(error);
            console.log('::Message Sent::');
    });
};

    

var handleFlowMessage = function(message) {
    if(message.event == 'message' && message.tags.indexOf('ornithology') !== -1) {
        var tagPattern = new RegExp('(help|snooze|status|on|off)');
        var result = tagPattern.exec(message.content);
        if(result == null) {
            console.log('no #ornithology command found');
            return;
        }
        switch (result[0]) {
            case 'help':
                console.log('help');
                postMessage('Available `#ornithology` options are `help`, `snooze`, `status`, `on` and `off`');
                break;
            case 'snooze':
                console.log('snooze');
                messageStatus = 'snooze';
                setTimeout(function() {
                    messageStatus = 'on';
                    postMessage('ornithology snooze over, messages have been turned back on');
                }, 1800000);
                postMessage('ornithology messages will be snoozed for 30 minutes');
                break;
            case 'status':
                console.log('status');
                postMessage('ornithology messages are currently '+messageStatus);
                break;
            case 'on':
                console.log('on');
                messageStatus = 'on';
                postMessage('ornithology messages have been turned on');
                break;
            case 'off':
                console.log('off');
                messageStatus = 'off';
                postMessage('ornithology messages have been turned off');
                break;
        }
    }
}
var observeFlow = function() {
    console.log('Observing: '+config.flow);

    var streamUrl = 'https://'+config.cred+':'+ config.pass +'@stream.flowdock.com/flows?filter='+config.org+'/'+config.flow
    var jsonStream = new EventSource(streamUrl);

    jsonStream.onmessage = function(e) {
        handleFlowMessage(JSON.parse(e.data));
    }
};
//*
observeFlow();
setInterval(checkStatus, 60000);
/*/
checkStatus();
//*/

