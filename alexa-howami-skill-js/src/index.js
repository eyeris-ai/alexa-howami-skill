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
var now = require("performance-now");
var config= require('./config.json');

/**
 * App ID for the skill
 */
var APP_ID = config.APP_ID; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var EMOVU_API_KEY = config.emovu_api_key;  // Add an EmoVu API Key
var runid = Date();
// You might need to invoke another lambda directly
// Be mindful of your resource limits
// var lambda = new AWS.Lambda();


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
    var speechOutput = "Welcome to the Eyeris EmoVu How Am I Skill, you can say How Am I";
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
        // Fetch the EmoVu result from S3
        //

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
        var saytext = "You are doing great";

        //
        // Card Heading
        //
        var cardheading = "How Am I?  I'll Tell you";

        //
        // Card Text
        // Potentially we might want to say a lot more in a card
        // Otherwise, just copy the say text.
        var additionaltext = ".  I see you.  Don't ever change";
        var cardtext = saytext + additionaltext;
        response.tellWithCard(saytext, cardheading, cardtext);
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can say How Am I", "You can say How Am I");
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HowAmISkill skill.
    console.log(runid, event);
    var howAmISkill = new HowAmISkill();
    howAmISkill.execute(event, context);
};