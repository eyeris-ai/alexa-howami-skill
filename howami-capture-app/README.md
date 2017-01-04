# Overview

The How Am I capture app demonstrates capturing of a live camera stream, and integrating with the EmoVu Web API.  The resulting stream can be queried.

# Design

Approach 1: Capture image frames in a loop, and push them up to the EmoVu Web API and perform face analysis.  Take the result and push it to S3 as a JSON object.  Let the Lambda Function for the How Am I Skill to pull the current result from S3.  If the result is older than one minute old, the result is considered stale, and Alexa will just report that she couldn't determine your mood.  If there is no result at all, Alexa will report that the How Am I Capture app isn't configured.  There will likely be some latency in transfer of results to S3, however, it is offset by the low latency of calls between Lambda and S3.

There are possibly some more efficient approaches, enumerated below:

- Approach 2: Capture the image, and push into S3, let the Lamba Function handle the communication with EmoVu Web API.  Downside is the Lambda function can get tripped up in the time it takes to process Web API calls.
- Approach 3: Create a general registry web service for anyone running a How Am I Capture App.  It proxies calls to EmoVu Web API and pushes results into the user's account namespace.  The Lambda function then only needs to have linked the user's Alexa account with the How Am I Capture App account.  This is a more scalable approach to serve a broader user base that won't likely have an S3 bucket ready to go.
- Approach 4: Maintain all results locally, and publish updates on some interval using SNS.
- Approach 5: Create a tunnel back to the local device, and request the result directly from the device running the How Am I Capture app.  This is overly complicated an fraught with security risks.

# Dependencies

See the package.json for the latest dependencies.  In general, we are using v4l, pngjs, the Amazon SDK, some blood, sweat, tears, and coffee.

# Setup

- Configure an S3 bucket
- Setup an account with the Eyeris EmoVu Web API

# Run

TODO

# What To Do Next

TODO