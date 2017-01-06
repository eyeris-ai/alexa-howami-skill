/**
#
#Copyright (c) 2017 Eyeris Technologies, LLC. All rights reserved.
#
#Redistribution and use in source and binary forms, with or without modification,
#are permitted provided that the following conditions are met:
#
#    * Redistributions of source code must retain the above copyright notice,
#      this list of conditions and the following disclaimer.
#
#    * Redistributions in binary form must reproduce the above copyright notice,
#      this list of conditions and the following disclaimer in the documentation
#      and/or other materials provided with the distribution.
#
#    * Neither the name of Eyeris Technologies, LLC, nor the names of its
#      contributors may be used to endorse or promote products derived from this
#      software without specific prior written permission.
#
#THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
#ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
#WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
#DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
#ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
#(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
#LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
#ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
#(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
#SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/


/**
 * This code talks to the Eyeris EmoVu Web API.  Make sure you set that up first.
 * Since we don't really care about what happened in the last utterance, we don't worry
 * about session state.  And because we only have a simple question/answer with no converation
 * it is really like a one-shot model
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, How Am I?"
 *  Alexa: "You are doing great, happy in fact"
 */


//
// Include only the packages you need
//
var AWS = require('aws-sdk');
// var now = require("performance-now");
var config = require('./config.json');
var pkg = require('./package.json');

/**
 * App ID for the skill
 */
// XXX As long as this APP_ID is undefined for testing/development, AWS won't bug you about
// having a real APP_ID
// Update this to read from config.APP_ID
var APP_ID = undefined; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var EMOVU_API_KEY = config.emovu_api_key;  // Add an EmoVu API Key
var runid = Date();
// You might need to invoke another lambda directly
// Be mindful of your resource limits
// var lambda = new AWS.Lambda();
var EMOTION_SET = [
    "Anger",
    "Disgust",
    "Fear",
    "Joy",
    "Neutral",
    "Sadness",
    "Surprise"
];

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * HowAmISkill is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var HowAmISkill = function () {
    AlexaSkill.call(this, APP_ID);
};


// Extend AlexaSkill
HowAmISkill.prototype = Object.create(AlexaSkill.prototype);
HowAmISkill.prototype.constructor = HowAmISkill;

HowAmISkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("HowAmISkill onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

HowAmISkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("HowAmISkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to the How Am I Skill.  Hold your expression and say How am I";
    var repromptText = "You can say How Am I";
    response.ask(speechOutput, repromptText);
};

HowAmISkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("HowAmISkill onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

HowAmISkill.prototype.intentHandlers = {
    // register custom intent handlers
    "HowAmISkillIntent": function (intent, session, response) {
        //
        // Setup your AWS SDK
        //
        var officialClientCfg = {
          accessKeyId: config.accessKeyID, 
          secretAccessKey: config.secretAccessKey,
          region: config.region // 'us-east-1' US East (N. Virginia), for use w/ Alexa Echo stuff
                                // http://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region
                                // http://docs.aws.amazon.com/general/latest/gr/rande.html#lambda_region
                                // Be sure you send S3 to the same region as your Lambda Functions
        };
        AWS.config.update(officialClientCfg);
        var s3 = new AWS.S3();

        //
        // Fetch the EmoVu result from S3
        //
        var params = {
            "Bucket": config.S3bucketID,
            "Key": config.S3key
        }

        s3.getObject(params, function(err, data) {
            //
            // Parse the EmoVu result
            //

            //
            // Based on the result, determine how to respond
            //
            // Either say the phrase matching the emotion
            //
            // Or tell the user you can't tell how they are doing (if no fresh data)
            //
            // Or if no results, say they need to set up their How Am I Capture App

            //
            // Say
            //
            var saytext = "You are doing great.";

            //
            // Card Heading
            //
            var cardheading = "How Am I?  I'll Tell you.";

            //
            // Card Text
            // Potentially we might want to say a lot more in a card
            // Otherwise, just copy the say text.
            var additionaltext = ".  I see you.  Don't ever change.";

            if (err) {
                console.log(err, err.stack); // an error occurred
                //
                // Form an error response
                //
                saytext = "Hmmmm I couldn't find your data or you need to configure your bucket";
                cardheading = "How Am I?  You have configuration Problems."
                additionaltext = ".  My suggestion is to check the configuration of your bucket or your EmoVu api keys";
            } else {
                console.log(data);
                if (data && data.Body.length > 0) {
                    try {
                        var jsonData = JSON.parse(data.Body.toString('utf-8'));
                        //
                        // Form an Valid response
                        //
                        // Format:
                        //  - Tracked - should be true
                        //
                        // Some additional useful stuff
                        // See more details about results here: http://emovu.com/docs/html/web_api.htm
                        //
                        /*
                        "FaceAnalysisResults": [{
                            "AgeGroupResult": {
                                "AgeGroup": "Adult",
                                "Computed": true,
                                "Confidence": 0.984
                            },
                            "EmotionResult": {
                                "Anger": 0.002,
                                "Computed": true,
                                "Disgust": 0.01,
                                "Fear": 0.0,
                                "Joy": 0.0,
                                "Neutral": 0.986,
                                "Sadness": 0.002,
                                "Surprise": 0.0
                            },
                            "GenderResult": {
                                "Computed": true,
                                "Confidence": 1.0,
                                "Gender": "Male"
                            }
                        }]
                        */

                        //
                        // Homework assignment, build a more sophisticated and varied set of responses
                        // Maybe create a magic 8 ball style set of answers
                        // Or maybe do some more sophisticated analysis.  Were eyes closed?
                        // Can you address the person by Gender?
                        // Can you guess at the age range?
                        // How about give us some sentiment
                        //
                        if (jsonData.Tracked) {
                            //
                            // Grab the emotion values
                            //
                            // XXX We should be a bit more careful and verify the properties exist
                            var emotionResult = jsonData.FaceAnalysisResults[0].EmotionResult;

                            var topscorevalue = 0;
                            var rankedEmotionScores = [];

                            for (var i = 0; i < EMOTION_SET.length; i++) {
                                // console.log("Checking emotion ", EMOTION_SET[i]);
                                if (rankedEmotionScores.length > 0) {
                                    for (var j = 0; j < rankedEmotionScores.length; j++) {
                                        // console.log("Checking value ", emotionResult[EMOTION_SET[i]], " against ranked score: ", rankedEmotionScores[j]);
                                        if (emotionResult[EMOTION_SET[i]] > rankedEmotionScores[j][1]) {
                                            //
                                            // Push to front and set the topscorevalue
                                            //
                                            rankedEmotionScores.splice(j,0, [EMOTION_SET[i],emotionResult[EMOTION_SET[i]]]);
                                            // console.log("Setting topscorevalue to ", emotionResult[EMOTION_SET[i]]);
                                            if (emotionResult[EMOTION_SET[i]] > topscorevalue) {
                                                // console.log("Setting topscorevalue to ", emotionResult[EMOTION_SET[i]]);
                                                topscorevalue = emotionResult[EMOTION_SET[i]];
                                            }
                                            break;
                                        } else {
                                            if (j == (rankedEmotionScores.length-1)) {
                                                rankedEmotionScores.push([EMOTION_SET[i],emotionResult[EMOTION_SET[i]]]);
                                                if (emotionResult[EMOTION_SET[i]] > topscorevalue) {
                                                    // console.log("Setting topscorevalue to ", emotionResult[EMOTION_SET[i]]);
                                                    topscorevalue = emotionResult[EMOTION_SET[i]];
                                                }
                                                break;
                                            }
                                        }
                                    }
                                } else {
                                    rankedEmotionScores.push([EMOTION_SET[i],emotionResult[EMOTION_SET[i]]]);
                                    // console.log("Setting topscorevalue to ", emotionResult[EMOTION_SET[i]]);
                                    if (emotionResult[EMOTION_SET[i]] > topscorevalue) {
                                        // console.log("Setting topscorevalue to ", emotionResult[EMOTION_SET[i]]);
                                        topscorevalue = emotionResult[EMOTION_SET[i]];
                                    }
                                }
                            }

                        // console.log(rankedEmotionScores);
                        // console.log("topscorevalue = ", topscorevalue);
                            /*
                            var scores = "";
                            for (var k = 0; k < rankedEmotionScores.length; k++) {
                                scores += rankedEmotionScores[k][1] + " ";
                            }
                            */
                            if (rankedEmotionScores[0][0] === "Anger") {
                                saytext = "Woah, you mad bro?  Don't be so Angry."; // + jsonData.Timestamp + ", top score is ", topscorevalue;
                            } else if (rankedEmotionScores[0][0] === "Disgust") {
                                saytext = "Hmmm, do you smell something bad?  Check your shoes.   Ew, disgusting.";
                            }  else if (rankedEmotionScores[0][0] === "Fear") {
                                saytext = "What are you afraid of?  You look scared.";
                            } else if (rankedEmotionScores[0][0] === "Joy") {
                                saytext = "Now that's a smile worth a million bucks.  Your joy is contagious.";
                            }  else if (rankedEmotionScores[0][0] === "Neutral") {
                                saytext = "Do you always hide your feelings?  You are expressionless.";
                            }  else if (rankedEmotionScores[0][0] === "Sadness") {
                                saytext = "Are you feeling ok?  You seem sad.  Too much CES?";
                            }  else if (rankedEmotionScores[0][0] === "Surprise") {
                                saytext = "You look shocked.  Did we just surprise you with an awesome demo?";
                            } else {
                                saytext = "Hmmmm, you are experiencing an emotion I cannot describe.";
                            }
                            // console.log("About to say: ", saytext);
                        } else {
                            //
                            // Form an Error
                            //
                            saytext = "That's strange, but we weren't able to detect any faces.  Are you there?  Try again.";
                            cardheading = "How Am I?  I can't see you."
                            additionaltext = ".  Some things to try: Make sure your camera is on, make sure you are sitting in front of your camera, hold still!";
                        }

                        

                        //
                        /*
                        saytext = "Hmmmm I had a problem loading results.  You have bad data.  Bad.";
                        cardheading = "How Am I?  Your data is bad."
                        additionaltext = ".  My suggestion is to check in your S3 bucket why your results are empty";
                        */
                    } catch(err) {
                        //
                        // Form an error response
                        //
                        saytext = "Hmmmm I had a problem loading results.  You have bad data.  Bad.";
                        cardheading = "How Am I?  Your data is bad."
                        additionaltext = ".  My suggestion is to check in your S3 bucket why your results are empty";
                    }
                } else {
                    //
                    // Strange, no data?  Maybe an empty results file?
                    // Something went wrong
                    //
                    // Form an error response
                    //
                    saytext = "Hmmmm I had a problem loading results.  Try again later.";
                    cardheading = "How Am I?  I couldn't find any data."
                    additionaltext = ".  My suggestion is to check in your S3 bucket why your results are empty";
                }
            }

            //
            // Generate a response to the User
            //
            var cardtext = saytext + additionaltext;
            response.tellWithCard(saytext, cardheading, cardtext);
        });

    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can say How Am I", "You can say How Am I");
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HowAmISkill skill.
    console.log(runid, pkg.version, event);
    var howAmISkill = new HowAmISkill();
    howAmISkill.execute(event, context);
};