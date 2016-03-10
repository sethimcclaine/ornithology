'use strict';

/**
 * Check API every X amount of seconds
 * Count the number of missed webhook lags
 * Post a message in flow when count is increased

            ___     ___
           // ,\/o\/ ,\\                     {o,o}
          //\__/-^-\__/\\                   ./)_)   {o,o}
         //             \\                    " "  ./)_)
    /^\ /^\ /^\ /^\ /^\ /^\ /^\                      " "
    |X| |X| |X| |X| |X| |X| |X|


 * @author Seth M.
 */

var request = require('request'),
    flowdock = require('./flowdock'),
    config = require('./config.js'),
    fdConn = new flowdock(config),
    messageStatus = 'on',
    lastCount = {
        V1: 100,
        V2: 100
    },
    urls = {
    V1: 'http://ocm-canary.f4tech.com/results',
    V2: 'http://ocm-canary.f4tech.com/results-v2'
};
var TAG_PATTERN = new RegExp('(help|snooze|status|on|off)');

var RESPONSE_MESSAGES = {
    'help': 'Available `#ornithology` options are `help`, `snooze`, `status`, `on` and `off`',
    'snooze': 'ornithology messages will be snoozed for 30 minutes',
    'status': 'ornithology messages are currently ',
    'on': 'ornithology messages have been turned on',
    'off': 'ornithology messages have been turned off'
};


var parseResponse = function parseResponse(body, version) {
    var missing = [],
        hooks = body['webhooks-data'];

    for (var i in hooks) {
        if (!hooks[i]['webhook-t']) {
            missing.push(hooks[i]);
        }
    }

    if (missing.length > 2) {
        console.log(version + ' Missing Webhook Calls: ' + missing.length);

        if (missing.length > lastCount[version]) {
            missing.reverse();
            var message = version + ' Missing Webhook Calls (#spotw)' + '\nCurrent:' + missing.length + '\nPrevious:' + lastCount[version] + '\nLast: ' + missing[0].desc;
            fdConn.postMessage(message);
        }
    } else {
        console.log(version + ' hooks are clean');
    }
    lastCount[version] = missing.length;
};

var processRequestV1 = function processRequestV1(error, response, body) {
    if (!error && response.statusCode == 200) {
        parseResponse(JSON.parse(body), 'V1');
    } else {
        console.log('error processing');
    }
};
var processRequestV2 = function processRequestV2(error, response, body) {
    if (!error && response.statusCode == 200) {
        parseResponse(JSON.parse(body), 'V2');
    } else {
        console.log('error processing');
    }
};
var checkStatus = function checkStatus() {
    request(urls['V1'], processRequestV1);
    request(urls['V2'], processRequestV2);
};

var handleFlowMessage = function handleFlowMessage(message) {
    if (message.event == 'message' && message.tags.indexOf('ornithology') !== -1) {

        var result = TAG_PATTERN.exec(message.content),
            append = '';
        if (result == null) {
            console.log('no #ornithology command found');
            return;
        }
        switch (result[0]) {
            case 'status':
              append = messageStatus;
              break;
            case 'snooze':
                messageStatus = 'snooze';
                setTimeout(function () {
                    messageStatus = 'on';
                    fdConn.postMessage('ornithology snooze over, messages have been turned back on');
                }, 1800000);
                break;
            case 'on':
                messageStatus = 'on';
                break;
            case 'off':
                messageStatus = 'off';
                break;
        }
        console.log(result[0]);
        fdConn.postMessage(RESPONSE_MESSAGES[result[0]] + append);
    }
};

console.log("observing ", config.flow);
fdConn.observeFlow(handleFlowMessage);
setInterval(checkStatus, 60000);
