var http = require('http');
var path = require('path');
var fs = require('fs');
var util = require('util');
var os = require('os');
var querystring = require('querystring');

var v4l2camera = require("v4l2camera");
var pngjs = require("pngjs");
var FormData = require('form-data');

var config = require("./config.json");

var EMOVU_WEB_API_BASE_URL = "http://api.emovu.com/api/imageframe/";
var PNGOUT = "capture.png";
var frameno = 0;
var lastFrameResult = undefined;
var starttimeinms = 0;

var server = http.createServer(function (req, res) {
    //console.log(req.url);
    if (req.url === "/") {
        res.writeHead(200, {
            "content-type": "text/html;charset=utf-8",
        });
        res.end([
            "<!doctype html>",
            "<html><head><title>EmoVu How Am I Capture</title><meta charset='utf-8'/>",
            "<script>(", pngLoaderScript.toString(), ")()</script>",
            "</head><body>",
            "<img id='cam' width='352' height='288' />",
            "</body></html>",
        ].join(""));
        return;
    }
    if (req.url.match(/^\/.+\.png$/)) {
        res.writeHead(200, {
            "content-type": "image/png",
            "cache-control": "no-cache",
        });
        var png = toPng();
        frameno++;
        // XXX Add in some code to compute FPS
        console.log("Frame #" + frameno);
        // Call EmoVu API on every frame
        analyzeFaceFrame(png, lastFrameResult, function(data){
        	if (data) {
        		lastFrameResult = data;
        	}
        });
        return png.pack().pipe(res);
    }
});
server.listen(3000);

var pngLoaderScript = function () {
    window.addEventListener("load", function (ev) {
        var cam = document.getElementById("cam");
        (function load() {
            var img = new Image();
            img.addEventListener("load", function loaded(ev) {
                cam.parentNode.replaceChild(img, cam);
                img.id = "cam";
                cam = img;
                load();
            }, false);
            img.src = "/" + Date.now() + ".png";
        })();
    }, false);
};

var toPng = function () {
    var rgb = cam.toRGB();
    var png = new pngjs.PNG({
        width: cam.width, height: cam.height,
        deflateLevel: 1, deflateStrategy: 1,
    });
    var size = cam.width * cam.height;
    for (var i = 0; i < size; i++) {
        png.data[i * 4 + 0] = rgb[i * 3 + 0];
        png.data[i * 4 + 1] = rgb[i * 3 + 1];
        png.data[i * 4 + 2] = rgb[i * 3 + 2];
        png.data[i * 4 + 3] = 255;
    }
    png.pack().pipe(fs.createWriteStream(PNGOUT));
    return png;
};

var analyzeFaceFrame = function(png, lastFrameResult, callback) {
	console.log("analyzeFaceFrame");
	var result = undefined;

	if (starttimeinms === 0) {
		starttimeinms = Date.now();
	}

	var timestamp = Date.now()-starttimeinms;
	/*
		An EmoVu Web API call requires these params:

		LicenseKey
		previousFrameResult
		imageFile
		timestamp

		Further tuning params:
		XXX TODO
	*/
	var postdata = querystring.stringify({
		"LicenseKey": config.emovu_api_key,
		"previousFrameResult": lastFrameResult,
		"imageFile": png,
		"timestamp": timestamp
	});

	if (!lastFrameResult) {
		lastFrameResult = "";
	}
	var form = new FormData();
	
	// form.append('my_buffer', new Buffer(10));
	// form.append('my_file', fs.createReadStream('/foo/bar.jpg'));

	form.append('LicenseKey', config.emovu_api_key);
	form.append('previousFrameResult', lastFrameResult);
	form.append('imageFile', PNGOUT);
	form.append('timestamp', timestamp);
	// console.log(form);

	var request = http.request({
	  method: 'post',
	  host: 'api.emovu.com',
	  path: '/api/imageframe',
	  headers: form.getHeaders()
	});

	form.pipe(request);

	request.on('response', function(res) {
	  console.log(res.statusCode);
	  callback({});
	});

	request.end();

	/*
	var req = http.request(
		{
			host: 'api.emovu.com',
            path: '/api/imageframe/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Content-Length': Buffer.byteLength(postdata)
            }
        }, function(response) {
        // Continuously update stream with data
        response.setEncoding('utf-8');
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('error', function(err) {
      		console.error(err);
    	});

        response.on('end', function() {
        	console.log("Results\n=======\n");
        	console.log(body);
            // var parsed = JSON.parse(body);

            // Pass back results
            callback({});
        });
    });
	req.on('error', function() {
		console.log("error");
	});
    req.write(postdata);
    req.end();
    */

};
var cam = new v4l2camera.Camera("/dev/video0");  // XXX Hardcoded values
cam.configSet({width: 352, height: 288}); // XXX Harcoded values
cam.start();
cam.capture(function loop() {
    cam.capture(loop);
});

