var api = require('api');
console.log(api.get('/yup', function (request) {
    console.log('sup');
}));
/*
var api
app.
app.listen(3000);




var filterMod = require('./module.js');
var filePath = process.argv[2];
var extStr = process.argv[3];

filterMod(filePath, extStr, function(err, data) {
 if (err) {
     console.log("ERROR");
 } else {
     data.forEach(function(d) {
         console.log(d.toString());
     });
 }
});
/**/