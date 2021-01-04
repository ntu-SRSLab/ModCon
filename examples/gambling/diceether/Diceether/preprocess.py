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

def reduce_trace():
    outputs = []
    with open("./usertrace.txt", encoding="utf-8") as f: 
            lines = f.readlines()
            for line in lines:
                trace = line.strip().split(" ")
                if len(trace) > 40:
                    trace = trace[:40]
                output = loop_handle(trace)
                # print(output)
                outputs.append(output)
    # print(outputs)
    with open("./usertrace_reduced.txt", "w", encoding="utf-8") as fo:
         fo.write( "\n".join(outputs))
    pass


def tuplize_result(line):
    arr = line.strip().split(" ")
    return arr[0], arr[1], 1 if arr[-1]=="success" else 0

def tuplize_bn(line):
    arr = line.strip().split(" ")
    return arr[0], arr[1], arr[-1]

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
        '''

if __name__ == "__main__":
    # reduce_trace()
    i = 0
    args = sys.argv[1:]
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
            else:
                print("wrong program input; program input should be: ")
                print(cmdOpt)
                exit(0)
        except IndexError as e:
                print("wrong program input; program input should be: ")
                print(cmdOpt)
                exit(0)
    if "input" not in options:
                print("no input file; it should be: `--input  input file` ")
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

        
