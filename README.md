# Overview

An example Alexa Skill using Eyeris EmoVu http://emovu.com/e/ face analytics.  Ask it "Alexa How Am I?" and Alexa will return an answer describing your emotion.  This skill assumes you have an EmoVu HowMe App running on your host system

# Concept

Below is a diagram of the demo concept.


![](https://github.com/truedat101/alexa-howami-skill/blob/master/assets/HowAmIAlexaSkillDiagram.png?raw=true)

The Alexa Skill project must be deployed t
# Dependencies

- An ol' version of Node.js v0.10.x is preferred, as the v4l code won't compile with newer stuff
- Access to the EmoVu Web API (see: http://emovu.com/docs/html/web_api.htm), contact info@eyeristech.com with subject: Dashboard Access Request
- A Web Cam (supporting Linux UVC, see: http://www.ideasonboard.org/uvc/ )
- A Linux host system with v4l (ARMv7, ARMv8, or IA64)
- An AWS account

# Setup & "Build"

To setup and deploy your Alexa How Am I Skill, take a look in the alexa-howami-skil-js readme.

To capture data, take a look in the How Am I Capture App.

# Use

Once everything is deployed, you can just ask Alexa, "How Am I?"

Some tips on using the EmoVu Web API using curl: https://gist.github.com/truedat101/a5796c6a2ad834cc23d6fa762513c489
