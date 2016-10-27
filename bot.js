var ApiBuilder = require("claudia-api-builder");
var api = new ApiBuilder();

api.get("/hello/{name}", function (request) {
    var name = request.pathParams.name;
    return "Hello World - meet " + name;
});

module.exports = api;
