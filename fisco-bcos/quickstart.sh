#!/bin/bash
bash build_chain.sh -l "127.0.0.1:4" -p 30300,20200,8545
bash nodes/127.0.0.1/start_all.sh
