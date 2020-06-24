#!/bin/sh
 sudo chown -R $USER:$USER *
 python dopple.py  $(pwd)/Ethereum/geth.ipc http://127.0.0.1:8645
