#!/bin/bash
# start back-end (server) of ModCon
workdir=$(pwd)
cd $workdir/server && (node server.js &)
sleep 120
# start front-end (client) of ModCon
cd $workdir/app && npm run serve
