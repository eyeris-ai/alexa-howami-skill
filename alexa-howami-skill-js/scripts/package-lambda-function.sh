#!/bin/sh
cd src
# NOTE: If you have any native modules, you MUST package them up
# of course, it must match the architecture of the AWS EC2/Lambda
zip archive.zip AlexaSkill.js index.js package.json config.json