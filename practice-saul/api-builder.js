var ApiBuilder = require('claudia-api-builder')
	, api = new ApiBuilder();

module.exports = api;

api.get('/hello', function () {
	return "Hello There.";
});


/* 
Lookup claudia-api-builder ojbect constructor.
Not sure how exporting objects work... propably a design pattern and not a function module type of export
*/


/* FROM Example
var ApiBuilder = require('claudia-api-builder')
	, api = new ApiBuilder()
	, superb = require('superb')
//    , express = require('express')
//    , app = express()
    ;
module.exports = api;

api.get('/greet', function (request) {
	return request.queryString.name + ' is ' + superb();
});

console.log('THIS: ' + JSON.stringify(api));
//api.forEach(function(obj){
//    console.log(obj);
//});


*/












