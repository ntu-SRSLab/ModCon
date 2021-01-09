import sys
import numpy as np
# preprocess data
def combine_words(input,length):
    if len(input) == 1:
        return input, length
    combined_inputs = []
    if len(input)>1:
        for i in range(len(input)-1):
            combined_inputs.append(input[i]+" "+last_word_of(input[i+1],length)) #add the last word of the right-neighbour (overlapping) sequence (before it has expanded), which is the next word in the original sentence
    return combined_inputs, length+1

def remove_duplicates(input, length):
    if len(input) == 1:
        return input
    bool_broke=False #this means we didn't find any duplicates here
    for i in range(len(input) - length):
        if input[i]==input[i + length]: #found a duplicate piece of sentence!
            for j in range(0,length): #remove the overlapping sequences in reverse order
                del input[i + length - j]
            bool_broke = True
            break #break the for loop as the loop length does not matches the length of splitted_input anymore as we removed elements
    if bool_broke:
        return remove_duplicates(input, length) #if we found a duplicate, look for another duplicate of the same length
    return input

def last_word_of(input,length):
    splitted = input.split(" ")
    if len(splitted)==0:
        return input
    else:
        return splitted[length-1]


def loop_handle(Trace):
    try:
        splitted_input = Trace
        word_length = 1
        splitted_input = remove_duplicates(splitted_input,word_length)
        # maintain the possible loop of consecutive method sequence of size two
        splitted_input,word_length = combine_words(splitted_input,word_length)
        intermediate_output = False
        while len(splitted_input)>1:
            splitted_input = remove_duplicates(splitted_input,word_length) #look whether two sequences of length n (with distance n apart) are equal. If so, remove the n overlapping sequences
            splitted_input, word_length = combine_words(splitted_input,word_length) #make even bigger sequences
            if intermediate_output:
                print(splitted_input)
                print(word_length)
        output = splitted_input[0] #In the end you have a list of length 1, with all possible lengths of repetitive words removed
    except IndexError as e:
        print(splitted_input )
        raise "wrong input"
    return output
    pass 

def reduce_trace(input_file):
    outputs = []
    with open(input_file, encoding="utf-8") as f: 
            lines = f.readlines()
            for line in lines:
                trace = line.strip().split(" ")
                if len(trace) > 40:
                    trace = trace[:40]
                output = loop_handle(trace)
                # print(output)
                outputs.append(output)
    # print(outputs)
    # with open(output_file, "w", encoding="utf-8") as fo:
    #      fo.write( "\n".join(outputs))
    # pass
    return outputs


def tuplize_result(line):
    arr = line.strip().split(" ")
    return arr[0], arr[1], 1 if arr[-1]=="success" else 0

def tuplize_bn(line):
    arr = line.strip().split(" ")
    return arr[0], arr[1], arr[-1]

def tuplize_session(line):
    arr = line.strip().split(" ")
    return arr[0], arr[1], arr[-2],1 if arr[-1]=="success" else 0


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




def test_kmeans(input_matrix_file):
    import pandas as pd 
    from sklearn.cluster import KMeans
    csvdata = pd.read_csv(input_matrix_file, sep=" ")
    # print(csvdata)
    X = csvdata.to_numpy()[:,1:]
    print(X)
    SIZE = 3
    kmeans = KMeans(n_clusters=SIZE, random_state=10).fit(X)
    users = csvdata.to_numpy()[:,0]
    labels = kmeans.labels_
    
    result = np.transpose([users, labels])
    clusters = dict()
    for size in range(SIZE):
        if size not in clusters:
            clusters[size] = set()
        for row in result:
            if  row[1] == size:
                clusters[size].add(row[0])
        print("cluster: %d, size: %s" % (size, str(len(clusters[size])) if len(clusters[size])>5 else clusters[size]))

    df = pd.DataFrame(np.transpose([users, labels]),   columns=['user', 'cluster_id'])
    return df 
    
def get_session_statistics(input_file):
    with open(input_file) as f:
        sessions = f.readlines()[1:]
        used_methods = set()
        for session in sessions:
            pairs = session.strip("\n").split(" ")[1:]
            for pair in pairs:
                used_methods.add(pair.split("-")[1])
        print(len(used_methods), used_methods)
        methodId = dict()
        no = 0
        for method in used_methods:
            methodId[method] = no 
            no += 1
        userVectors = dict()
        userSessions = dict()
        for session in sessions:
            sessionId = session.strip("\n").split(" ")[0]
            pairs = session.strip("\n").split(" ")[1:]
            for pair in pairs:
                user, function = tuple(pair.split("-"))
                if user not in userVectors:
                    userVectors[user] = np.zeros(len(used_methods))
                userVectors[user][methodId[function]] = 1

                if user not in userSessions:
                    userSessions[user] = set()
                userSessions[user].add(sessionId)    
        
        traces = set()
        for session in sessions:
            pairs = session.strip("\n").split(" ")[1:]
            trace = list()
            for pair in pairs:
                user, function = tuple(pair.split("-"))
                trace.append(function)
            traces.add(" ".join(trace))

        return used_methods, userVectors, traces, userSessions

def getUserBehaviour(input_file):
    NORMAL_USER = 0
    SERVER_USER = 1
    with open(input_file) as f:
        sessions = f.readlines()[1:]
        used_methods = set()
        roles = dict()
        for session in sessions:
            pairs = session.strip("\n").split(" ")[1:]
            for pair in pairs:
                user, function = tuple(pair.split("-"))
                used_methods.add(function)         
        print(len(used_methods), used_methods)
        for session in sessions:
            sessionId = session.strip("\n").split(" ")[0]
            pairs = session.strip("\n").split(" ")[1:]
            for pair in pairs:
                user, function = tuple(pair.split("-"))
                if user not in roles:
                    roles[user] = NORMAL_USER if function == "createGame" else SERVER_USER
        user_traces = set()
        server_traces = set()
        for session in sessions:
            sessionId = session.strip("\n").split(" ")[0]
            pairs = session.strip("\n").split(" ")[1:]
            user_trace = list()
            server_trace = list()
            for pair in pairs:
                user, function = tuple(pair.split("-"))
                if roles[user] == NORMAL_USER:
                    user_trace.append(function)
                else:
                    server_trace.append(function)
            if len(user_trace)>0:
                user_traces.add(" ".join(user_trace))
            if len(server_trace)>0:
                server_traces.add(" ".join(server_trace))
        return used_methods, user_traces, server_traces

def get_trace_from_result_bySessionId(input_file):
    with open(input_file) as f: 
            gameIdTraceMap  = dict()
            lines = f.readlines()[1:]
            for line in lines:
                user, function, session, status = tuplize_session(line)
                if status ==1 and session!="":
                    print(user, function ,session)
                    if session not in gameIdTraceMap:
                        gameIdTraceMap[session] = list()
                    gameIdTraceMap[session].append([user, function])
            return gameIdTraceMap

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
    --session   extract trace by session from transaction result
    --duration  extract duration from transaction blocknumber results
    --session_statistics  get statistic information about sessions
    --session_statistics_traces  get traces summary information about session
    --user_behaviour  get behavior traces of different users
    --cluster  cluster users 
    --trace_reduce  reduce traces
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
            elif args[i] == "--trace":
                options["trace"] = True
                i += 1
            elif args[i] == "--duration":
                options["duration"] = True 
                i += 1
            elif args[i] == "--session":
                options["session"] = True 
                i += 1
            elif args[i] == "--session_statistics":
                options["session_statistics"] = True 
                i += 1
            elif args[i] == "--session_statistics_traces":
                options["session_statistics_traces"] = True 
                i += 1
            elif args[i] == "--cluster":
                options["cluster"] = True 
                i += 1
            elif args[i] == "--trace_reduce":
                options["trace_reduce"] = True 
                i += 1
            elif args[i] == "--user_behaviour":
                options["user_behaviour"] = True 
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
    if "session" in options:
        gameIdTraceMap = get_trace_from_result_bySessionId(options["input"])
        if "output" in options:
            # print all user traces
            with open(options["output"], "w") as f:
                f.write("session  user-function user-function  user-function ...\n")
                for gameId in gameIdTraceMap:
                    f.write("%s %s\n" %(gameId, " ".join([ pair[0]+"-"+pair[1] for pair in gameIdTraceMap[gameId]])))

    if "session_statistics" in options:
        used_methods,  userVectors, traces, userSessions = get_session_statistics(options["input"])
        if "output" in options:
            # print all user traces
            with open(options["output"], "w") as f:
                f.write("user "+" ".join(used_methods)+" session_count\n")
                for user in userVectors:
                    f.write("%s %s %s\n" %(user, " ".join(map(lambda val: str(val), userVectors[user])), str(len(userSessions[user]))))
    
    if "session_statistics_traces" in options:
        used_methods,  userVectors, traces, userSessions = get_session_statistics(options["input"])
        if "output" in options:
            # print all user traces
            with open(options["output"], "w") as f:
                f.write("alphabet\n")
                f.write("\n".join(used_methods))
                f.write("\n---------------------\n")
                f.write("positive examples\n")
                f.write("\n".join(traces))
    
    if "cluster" in options:
        df = test_kmeans(options["input"])
        if "output" in options:
            # print all user traces
            df.to_csv(options["output"], index=False) 
    
     
    if "user_behaviour" in options:
        used_methods, user_traces, server_traces = getUserBehaviour(options["input"])
        print(user_traces, server_traces)
        if "output" in options:
            # print all user traces
            df.to_csv(options["output"], index=False) 
    
    if "trace_reduce" in options:
        outputs = reduce_trace(options["input"])
        print(outputs)
        if "output" in options:
            with open(options["output"], "w", encoding="utf-8") as fo:
                fo.write( "\n".join(outputs))
            pass   