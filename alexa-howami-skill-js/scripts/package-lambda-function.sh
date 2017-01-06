#!/bin/sh
cd src
# NOTE: If you have any modules, you MUST package them up
# of course, it must match the architecture of the AWS EC2/Lambda
# if they are native modules
zip -r archive.zip AlexaSkill.js index.js package.json config.json