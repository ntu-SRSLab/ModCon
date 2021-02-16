import sys
import numpy as np
import pandas as pd 
import os 

def tuplize_result(line):
    arr = line.strip().split(" ")
    if arr[0].find("0x")==-1:
        return arr[0], arr[1], 1 if arr[-1]=="success" else 0
    else:
        return arr[1], arr[2], 1 if arr[-1]=="success" else 0

def tuplize_bn(line):
    arr = line.strip().split(" ")
    return arr[0], arr[1], arr[-1]

def tuplize_session(line):
    arr = line.strip().split(" ")
    return arr[0], arr[1], arr[-2],1 if arr[-1]=="success" else 0

def tuplize_ether_session(line):
    arr = line.strip().split(" ")
    return arr[0], arr[1], arr[2], arr[-2],1 if arr[-1]=="success" else 0


# get trace from result.txt 
def get_trace_from_result(input_file):
    with open(input_file) as f: 
        userTraces  = dict()
        lines = f.readlines()[1:]
        for line in lines:
            user, function, status = tuplize_result(line)
            if status==1 :
                if user not in userTraces:
                    userTraces[user] = list()
                userTraces[user].append(function)
        return userTraces

def get_user_permission_matrix(input_file):
    with open(input_file) as f: 
                userFunctions = dict()
                lines = f.readlines()[1:]
                functions = set()
                for line in lines:
                    user, function, status = tuplize_result(line)
                    if status == 1:
                        functions.add(function)
                        if user not in userFunctions:
                            userFunctions[user] = set()
                        userFunctions[user].add(function)
                
                title = [[function for function in functions]]
                matrix = [ [1 if function in userFunctions[user] else 0 for function in functions]  for user in userFunctions ]
                df =  pd.DataFrame(np.array(matrix), columns=title)
                userLabels = [ user for user in userFunctions]
                return userLabels, df

                

def get_duration_from_tracebn(input_file):
    with open(input_file) as f: 
        userDurations  = dict()
        lines = f.readlines()[1:]
        for line in lines:
            user, function, bn = tuplize_bn(line)
            if user not in userDurations:
                userDurations[user] = list()
            userDurations[user].append(int(bn))

        durations = dict()
        for user in userDurations:
            # print(userDurations[user])
            durations[user] = [str(np.max(userDurations[user])-np.min(userDurations[user])+1),
             str(len(userDurations[user]))] 
        
        for user in userDurations:
            if len(userDurations[user])>1:
                durationPerTx = np.array(userDurations[user][1:]) - np.array(userDurations[user][:-1])
                durations[user].extend([ str(np.min(durationPerTx)), str(np.mean(durationPerTx)),str(np.max(durationPerTx))])
            else:
                durations[user].extend(["0", "0", "0"])

        return durations    
    pass 

cmdOpt = '''--------------------------------------------------------------
| Data preprocess for smart contract transactions on Ethereum |
--------------------------------------------------------------
    --help      usage help
    --input     input file
    --output    output file
    --trace     extract trace from transaction results
    --duration  extract duration from transaction blocknumber results
    --permission  get user permission matrix
        '''

if __name__ == "__main__":
    # reduce_trace()
    i = 0
    args = sys.argv[1:]
    print(args)
    options = dict()
    if len(args) == 0:
        print(cmdOpt)
        exit(0)
    while i< len(args):
        try:
            if args[i] == "--help":
                print(cmdOpt)
                exit(0)
            elif args[i] == "--input":
                options["input"] = args[i+1]
                i += 2
            elif args[i] == "--output":
                options["output"] = args[i+1]
                i += 2
            elif args[i] == "--duration":
                options["duration"] = True 
                i += 1
            elif args[i] == "--permission":
                options["permission"] = True 
                i += 1
            else:
                print("wrong program input; program input should be: ")
                print(cmdOpt)
                exit(0)
        except IndexError as e:
                print("wrong program input; program input should be: ")
                print(cmdOpt)
                exit(0)
    if ("trace" in options and "session" in options) or ("trace" in options and "duration" in options) or ("session" in options and "duration" in options):
        print("only one function is allowed once")
        print(cmdOpt)
        exit(0)
         
    if "input" not in options:
                if "trace" in options or "session" in options:
                    print("no input file; it should be: `--input  txResult.txt` ")
                elif "duration" in options:
                    print("no input file; it should be: `--input  txBN.txt` ")
                elif "session_statistics" in options:
                    print("no input file; it should be: `--input  txSession.txt` ")
                print(cmdOpt)
                exit(0)
    if "trace" in options:
        userTraces = get_trace_from_result(options["input"])
        if "output" in options:
            # print all user traces
            with open(options["output"], "w") as f:
                for user in userTraces:
                    f.write("%s %s\n" %(user, " ".join(userTraces[user])))
        
    if "duration" in options:
        userDurations = get_duration_from_tracebn(options["input"])
        if "output" in options:
            # print all user traces
            with open(options["output"], "w") as f:
                f.write("user  totalDuration  totalTxs  minDurationPerTx   meanDurationPerTx  maxDurationPerTx\n")
                for user in userDurations:
                    f.write("%s %s\n" %(user, " ".join(userDurations[user])))
      
    if "permission" in options:
        userLabels, df = get_user_permission_matrix(options["input"])
        if not os.path.exists("./data"):
            os.mkdir("./data")
        if "output" in options:
            with open("./data/"+options["output"]+"-userPermissionMatrix.csv", "w", encoding="utf-8") as fo:
                df.to_csv("./data/"+options["output"]+"-userPermissionMatrix.csv", index=False) 
            with open("./data/"+options["output"] + "-userLabel.txt", "w", encoding="utf-8") as fo:
                fo.write("\n".join(userLabels))