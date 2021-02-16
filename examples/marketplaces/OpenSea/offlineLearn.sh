#!/bin/bash

workdir=$(pwd)

cd /home/liuye/Projects/InfModConExtended/learnlib-demo/target/

# files=("sessionTraceSummary-reduce" "userBehaviour-user-reduce" "userBehaviour-admin-reduce")

files=(sessionTraceSummary)
for file in ${files[@]};
do 
    echo $file
    java -jar learnlib-demo-1.0-SNAPSHOT.jar --input $workdir/$file.txt --output $workdir/$file.dot  
done 