const lambdaLocal = require('lambda-local');
var path = require('path');

var jsonPayload = {
    'op1': [
        {
            "foo": "bar"
        }
    ],
    'key2': 'value2',
    'key3': 'value3'
}
 
lambdaLocal.execute({
    event: jsonPayload,
    lambdaPath: path.join(__dirname, 'index.js'),
    lambdaHandler: 'handler',
    profilePath: '~/.aws/credentials',
    profileName: 'lambdaProfile',
    timeoutMs: 300000,
    callback: function(err, data) {
        console.log("In callback");
        if (err) {
            console.log(err);
        } else {
            console.log(data);
        }
    }
});