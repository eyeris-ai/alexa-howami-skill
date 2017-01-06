var http = require('http');
var path = require('path');
var fs = require('fs');
var util = require('util');
var os = require('os');
var querystring = require('querystring');

var v4l2camera = require("v4l2camera");
var pngjs = require("pngjs");
// var FormData = require('form-data');
var request = require('request');

var config = require("./config.json");

var EMOVU_WEB_API_BASE_URL = "http://api.emovu.com/api/imageframe";
var PNGOUT = "capture";
var MAX_FRAMES = 30;
var frameno = 0;
var lastFrameResult = undefined;
var starttimeinms = 0;
var lasttimestamp = 0;

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
            "<EM>TODO: Fix web viewer, truncation</EM>",
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
        
        // XXX Add in some code to compute FPS
        console.log("Viewing Frame #" + frameno);

        // Call EmoVu API on every frame
        /* analyzeFaceFrame(png, lastFrameResult, function(data){
        	if (data) {
        		lastFrameResult = data;
        	}
        });
        */
        // png.pack().pipe(fs.createWriteStream(PNGOUT));
        // return png.pack().pipe(res);
        var fileStream = fs.createReadStream(__dirname + '/' + PNGOUT + "-" + frameno + ".png");
        return fileStream.pipe(res);
    }
});
server.listen(3000);

// XXX Fix this up ... we should be able to load the previous images easily without the clipping
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

var pngLoaderScript2 = function() {
    setInterval(function() {
	   	window.addEventListener("load", function (ev) {
		    
		    	console.log("Reloading");
		    	var img = new Image();
		    	var cam = document.getElementById("cam");
		    	cam.parentNode.replaceChild(img, cam);
		    	img.src = "/" + Date.now() + ".png";
		}, false);
	}, 1000);
};

var pngLoaderScript3 = function () {
    window.addEventListener("load", function (ev) {
        var cam = document.getElementById("cam");
        (function load() {
            var img = new Image();
            img.addEventListener("load", function loaded(ev) {
                cam.parentNode.replaceChild(img, cam);
                img.id = "cam";
                cam = img;
                setTimeout(function() {
                	load();
                }, 1000);
            }, false);
            img.src = "/" + Date.now() + ".png";
        })();
    }, false);
};

var toPng = function () {
	// console.log("toPng:", new Date());
    var rgb = cam.toRGB();
    var png = new pngjs.PNG({
        width: cam.width, height: cam.height, filterType: -1,
        deflateLevel: 9, deflateStrategy: 3,
    });
    var size = cam.width * cam.height;
    for (var i = 0; i < size; i++) {
        png.data[i * 4 + 0] = rgb[i * 3 + 0];
        png.data[i * 4 + 1] = rgb[i * 3 + 1];
        png.data[i * 4 + 2] = rgb[i * 3 + 2];
        png.data[i * 4 + 3] = 255;
    }
    
    png.pack().pipe(fs.createWriteStream(PNGOUT + "-" + frameno + ".png"));
    // Call EmoVu API on every frame
    console.log("Writing " + PNGOUT + "-" + frameno + ".png");

    //
    // If we open too many simultaneous connections, we either overwhelm our local
    // connection, or eventually DDOS the web server
    //
    // For right now, we don't need a realtime stream, getting 3-5 fps is fine
    //
    /*
    if (frameno > 5) {
    analyzeFaceFrame(frameno-5, lastFrameResult, function(data){
    	if (data) {
    		lastFrameResult = data;
    		console.log("Received result: ", data);
    	}
    });
    }
    */

    /*
    analyzeFaceFrame(frameno, lastFrameResult, function(data){
        if (data) {
            lastFrameResult = data;
            console.log("Received result: ", data);
        }
    });
    */
    // if (frameno === 5 || frameno === 10 || frameno === 15 || frameno === 20 || frameno === 25 || frameno === 30) {
    if (frameno === 10 || frameno === 20 || frameno === 30) {
        analyzeFaceFrame(frameno-1, lastFrameResult, function(data){
            console.log("analyzeFaceFrame done");
            if (data) {
                console.log("Inspecting data");
                if (data.Tracked && data.Tracked === true) {
                    console.log("Face Analytics Data Tracked, dialing up S3 to save results");
                } else {
                    console.log("No Face Analytics Data Tracked");
                }
            }
        });
    }

    if (frameno === MAX_FRAMES) {
    	frameno = 0;
    } else {
    	frameno++;
    }
    return png;
};

var analyzeFaceFrame = function(pngframeno, lastFrameResult, callback) {
	console.log("analyzeFaceFrame");
	var result = undefined;

	var timestamp;

	if (starttimeinms === 0) {
		starttimeinms = Date.now();
		timestamp = 0;
	} else {
		timestamp = Date.now()-starttimeinms;
	}
	/*
		An EmoVu Web API call requires these params:

		LicenseKey
		previousFrameResult
		imageFile
		timestamp

		Further tuning params:
		XXX TODO - For your homework
        We really don't want to compute all analytics, and tuning this will improve response time
	*/
	if (!lastFrameResult) {
		lastFrameResult = "";
	}


    console.log("Read stream for: " + PNGOUT + "-" + pngframeno + ".png, previous timestamp at: " + lasttimestamp);
    // console.log("Using lastFrameResult : " + lastFrameResult);
	var formData = {
	  // Pass a simple key-value pair
	  timestamp: timestamp,
	  previousFrameResult: lastFrameResult,
	  imageFile: fs.createReadStream(__dirname + '/' + PNGOUT + "-" + pngframeno + ".png")
      // imageFile: fs.createReadStream(__dirname + '/capture-99.png')
	};
    lasttimestamp = timestamp;
	// console.log("Calling emovu with formdata ", formData);
	request.post({
		url: EMOVU_WEB_API_BASE_URL,
		formData: formData,
		headers: {
			'LicenseKey': config.emovu_api_key
		}
	}, function optionalCallback(err, httpResponse, body) {
        if (err) {
            // NOTE, this is likely a network transport or configuration error
    	    console.error('upload failed:', err);
    	} else {
        	console.log('Post successful for frame#: ' + pngframeno + ' Server responded with:', body);
            console.log(httpResponse.statusCode);
            // Only save a result if we got a successful reply
            // I *think* we can assume the API only returns valid JSON, though we should check the
            // response.getHeader('Content-Type');
            if (httpResponse.statusCode == 200) {
                // XXX Don't do too much work here or we get a weird delayed-stream error
                lastFrameResult = JSON.parse(body);
                callback(lastFrameResult);
                // callback(JSON.parse(body));
            }
        }
	});

};

var cam = new v4l2camera.Camera("/dev/video0");  // XXX Hardcoded values
cam.configSet({width: 176, height: 120}); // XXX Harcoded values
cam.start();
cam.capture(function loop() {
	toPng();
    cam.capture(loop);
});

