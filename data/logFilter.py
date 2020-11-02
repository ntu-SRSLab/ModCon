import os
import json
def getLogs(logdir):
    logs = os.listdir(logdir)
    # print(logs)
    return logs

def filter(log,ofile):
    with open(ofile, "a", encoding="utf-8") as fout:
        with open(log) as f:
            records = json.load(f)
            # print(data)
            try:
                previous_record = records[0]["raw_tx"]["fun"]
                previous_state = records[0]["receipt"]["status"]
                for record in records:
                    if previous_record != record["raw_tx"]["fun"]:
                        # print(previous_record, previous_state)
                        fout.write("%s %s\n" % (previous_record, previous_state))
                        previous_record = record["raw_tx"]["fun"]
                        previous_state = record["receipt"]["status"]
                    else: 
                        if record["receipt"]["status"] == "0x0":
                            previous_state = "0x0"
                # print(previous_record, previous_state)
                fout.write("%s %s\n" % (previous_record, previous_state))
            except IndexError:
                # print(log)
                pass
        # print("----------------------------------")
        fout.write("----------------------------------\n")
def translate(recordsLog, record2learn):
    with open(record2learn, "w",encoding="utf-8") as flearn:
        with open(recordsLog) as f:
            records = f.readlines()
            # print(records)
            Alphabets = set()
            postive_examples = set()
            negative_examples = set()
            longest_postive_example = ""
            longest_negative_example = ""
            for record in records:
                if record != "----------------------------------\n":
                    Alphabets.add(record.split(" ")[0])
            # print(Alphabets)
            # print(len(Alphabets))
            mapping = dict()
            i = 0
            flearn.write("characters\n");

            for method in Alphabets:
                mapping[method] = chr(ord('a')+i)
                i += 1
                flearn.write("%c %s\n" %(mapping[method], method));
            print(mapping)
            flag = False
            for record  in records:
                if record != "----------------------------------\n":
                    method = record.split(" ")[0]
                    status = record.split(" ")[1]
                    if status != "0x0\n":
                        # print(record)
                        if longest_postive_example!="":
                            postive_examples.add(longest_postive_example)
                        longest_negative_example = longest_postive_example + mapping[method]
                        negative_examples.add(longest_negative_example)
                        # print(longest_negative_example)
                    else:
                        # print(record)
                        longest_postive_example = longest_postive_example + mapping[method]
                        # print(longest_postive_example)
                else:
                
                    if longest_postive_example!="":
                            postive_examples.add(longest_postive_example)
                    longest_negative_example = ""
                    longest_postive_example = ""
            if longest_postive_example!="":
                postive_examples.add(longest_postive_example)
            negative_examples.difference_update(postive_examples)
            print(postive_examples)
            flearn.write("positive examples\n")
            for example in postive_examples:
                flearn.write("%s\n" % (example))
            
            print(negative_examples)
            flearn.write("negative examples\n")
            for example in negative_examples:
                flearn.write("%s\n" % (example))
            
def invokeJavaProgram():
    os.system('cd /home/liuye/Projects/MachineLearning/learnlib-demo && mvn clean install &&mvn exec:java -Dexec.mainClass="org.learnlib.demo.passive.ModCon"')            
                    
def main():
    logdir = "./server/logs"
    records = "./data/records.txt"
    record2learn = "./data/learn.txt"
    if os.path.exists(records):
        os.remove(records)
    if os.path.exists(record2learn):
        os.remove(record2learn)
    logs = getLogs(logdir)
    for log in logs:
        filter(logdir + "/" + log,records)
    translate(records,record2learn)
    invokeJavaProgram()
    pass

if __name__ == "__main__":
    main()