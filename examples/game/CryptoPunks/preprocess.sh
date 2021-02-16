#!/bin/bash
#
# invoke preprocess.py to finishi data preprocessing
#


# python3 preprocess.py --session --input txResult-hash.txt --output txSession.txt
# python3 preprocess.py --session_statistics --input txSession.txt --output userSessionMatrix.csv
# python3 preprocess.py --session_statistics_traces --input txSession.txt --output sessionTraceSummary.txt
# python3 preprocess.py --trace_reduce --input sessionTraceSummary.txt --output sessionTraceSummary-reduce.txt
# python3 preprocess.py --user_behaviour --input txSession.txt --output userBehaviour.txt
# python3 preprocess.py --trace_reduce --input userBehaviour-user.txt --output userBehaviour-user-reduce.txt
# python3 preprocess.py --trace_reduce --input userBehaviour-admin.txt --output userBehaviour-admin-reduce.txt


python3 preprocess.py --session_statistics_traces --input txSession.txt --output sessionTraceSummary.txt

