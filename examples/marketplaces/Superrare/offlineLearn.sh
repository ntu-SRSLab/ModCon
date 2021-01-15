#!/bin/bash

workdir=$(pwd)

cd /home/liuye/Projects/MachineLearning/learnlib-demo/target/

# files=("sessionTraceSummary-reduce" "userBehaviour-user-reduce" "userBehaviour-admin-reduce")
files=(userBehaviour-user-reduce userBehaviour-admin-reduce)
for file in ${files[@]};
do 
    echo $file
    java -jar learnlib-demo-1.0-SNAPSHOT.jar --input $workdir/$file.txt --output $workdir/$file.dot  
done 