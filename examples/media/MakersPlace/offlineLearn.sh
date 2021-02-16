#!/bin/bash

workdir=$(pwd)

cd /home/liuye/Projects/MachineLearning/learnlib-demo/target/

files=(userBehaviour-admin-reduce userBehaviour-user-reduce)
files=(sessionTraceSummaryAugmented)
for file in ${files[@]};
do 
    echo $file
    java -jar learnlib-demo-1.0-SNAPSHOT.jar --input $workdir/$file.txt --output $workdir/$file.dot  
done 