var ApiBuilder = require('claudia-api-builder')
    , superb = require('superb')
	, api = new ApiBuilder()
;

module.exports = api;

api.get('/hello', function () {
	return "Hello There.";
});
api.get('/super', function (request) {
	return request.queryString.name + ' is ' + superb();
});
//console.log('THIS: ' + JSON.stringify(api));


/* 
Lookup claudia-api-builder ojbect constructor.
Not sure how exporting objects work... propably a design pattern and not a function module type of export
*/
