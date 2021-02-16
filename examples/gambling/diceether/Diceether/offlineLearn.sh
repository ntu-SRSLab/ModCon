#!/bin/bash

workdir=$(pwd)

cd /home/liuye/Projects/InfModConExtended/learnlib-demo/target/

# files=(userBehaviour-admin-reduce userBehaviour-user-reduce)
files=(sessionTraceSummary)
for file in ${files[@]};
do 
    echo $file.txt
    # cat $file.txt
    java -jar learnlib-demo-1.0-SNAPSHOT.jar --input $workdir/$file.txt --output $workdir/$file.dot  
done 