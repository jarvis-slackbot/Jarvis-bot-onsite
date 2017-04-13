/*
    Artificial Intelligence module
 */

var http_request = require('sync-request'); // DEMO ONLY
var http = require('http');
const qs = require('querystring');


module.exports = {

    // AI.api call
    aiQuery: function (phrase) {
        var response = "Error!";
        var ai = "";
        var query = {
            v: '20150910',
            query: phrase,
            lang: 'en',
            sessionId: '1234'
        };
        var addr = "https://api.api.ai/v1/query" + "?" + qs.stringify(query);
        // DEMO ONLY - synchronous call
        ai = http_request('GET', addr, {
            'headers': {
                'Authorization': 'Bearer 6faa8c514cb742c59ab1029ce3f48bc7'
            }
        });
        try {
            response = JSON.parse(ai.body);
            response = response.result.fulfillment.speech;
        } catch (err) {
            response = "Sorry, there was an error accessing my AI.\n" + err;
        }

        return response;
    }
};