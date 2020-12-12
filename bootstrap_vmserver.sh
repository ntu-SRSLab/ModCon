#!/bin/bash
# start back-end (server) of ModCon

webserver=$1
echo $webserver
workdir=$(pwd)
cd $workdir/server && npm install && (node server.js &)
sleep 120
# start front-end (client) of ModCon
cd $workdir/app && npm install && npm run serve src/main.js $webserver
