import os 
import numpy as  np



def tuplize(line):
    arr = line.strip().split(" ")
    # print(arr)
    # exit(0)
    #  user   function   status
    return arr[0], arr[1], 1 if arr[3]=="success" else 0

Groups = 0
groupList = list()
def getGroupArr(group, arr):
    arr_group = list()
    for user in group:
        arr_group.append(arr[user])
    return np.array(arr_group)
  

def split(group, arr, pivot):
    # get group arr
    arr = getGroupArr(group, arr)
    
    # search group contain 1
    sucGroup = np.where(arr[:,pivot]==1)
    
    #search group contain 0
    failGroup = np.where(arr[:,pivot]!=1)
    
    retSuc = []
    retFail = []
    for valAsindex in sucGroup[0]:
        retSuc.append(group[valAsindex])
    for valAsindex in failGroup[0]:
        retFail.append(group[valAsindex])
    # divide(nArr1, pivot+1) 
    # divide(nArr2, pivot+1)
    return retSuc, retFail
    pass

def divide(group, arr, pivot):
    global Groups
    if pivot == arr.shape[1]:
        Groups += 1
        print("Group No.", Groups, " ", group)
        groupList.append(group)
        return
    try:
        if np.var(getGroupArr(group, arr)[:, pivot]) < 0.00000000000001:
            divide(group, arr, pivot+1)
        else: 
            sucGroup, failGroup = split(group, arr, pivot)
            divide(sucGroup, arr, pivot+1)
            divide(failGroup, arr, pivot+1)
    except IndexError as e:
        print(arr)
        print(pivot)
        print(e)
        exit(-1)

def drawPie(group_stat, pie_title):
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(
    # figsize=(6, 3), 
    subplot_kw=dict(aspect="equal"))

    data = [float(x.split("|")[1]) for x in group_stat]
    explode = tuple([0.0 if data[i]/np.max(np.array(data)) > 0.01 else 0.4  for i in range(len(data))])

    groups = [x.split("|")[-1] for x in group_stat]


    def func(pct, allvals):
        # print(pct)
        absolute = int(pct/100.*np.sum(allvals))
        # return "{:.1f}%\n({:d} )".format(pct, absolute)
        return "{:.1f}%\n({:d} )".format(pct, absolute)


    wedges, texts, autotexts = ax.pie(data, explode=explode, autopct=lambda pct: func(pct, data),
                                    textprops=dict(color="w"))

    ax.legend(wedges, groups,
            title="Groups",
            loc="center"
            ,
            bbox_to_anchor=(0.5, 0.5, 1, 0.5)
            )

    plt.setp(autotexts, size=8, weight="bold")

    ax.set_title(pie_title)

    plt.show()


def freqDivide(userFrequences, left, right):
    lowfreq_users = []
    mediumfreq_users = []
    heavyfreq_users = []
    for user in userFrequences:
        if userFrequences[user] < left:
            lowfreq_users.append(user)
        elif userFrequences[user] > right:
            heavyfreq_users.append(user)
        else:
            mediumfreq_users.append(user)
    return lowfreq_users, mediumfreq_users, heavyfreq_users

def getUserTrace(USER, datalines):
    ls = list()
    for line in lines:
        user, function, status = tuplize(line)
        if 1 == status:
            if user == USER:
                ls.append(function)
    return ls

headTraces = dict()

def drawDFA(groupNo, group, userList, datalines):
    global headTraces
    alphabet = set()
    traces = set()
    for userIndex in group:
        user = userList[userIndex]
        trace = getUserTrace(user, datalines)
        if len(trace)>0:
            traces.add(" ".join(trace))
            alphabet = alphabet.union(set(trace))
            # merge user group by first same function calling
            if trace[0] not in headTraces:
                headTraces[trace[0]] = list()
            headTraces[trace[0]].append(trace)

    if len(alphabet)>0:
        with open("./group"+str(groupNo)+".txt","w") as f:
            f.write("alphabet\n")
            f.write("\n".join(alphabet))
            f.write("\n---------------------\n")
            f.write("positive examples\n")
            f.write("\n".join(traces))
    
def drawHeadMergeDFA():
    global headTraces
    for head in headTraces:
        traces = set()
        alphabet = set()
        for trace in headTraces[head]:
            traces.add(" ".join(trace))
            alphabet = alphabet.union(set(trace))
        with open("./group-"+head+".txt","w") as f:
            f.write("alphabet\n")
            f.write("\n".join(alphabet))
            f.write("\n---------------------\n")
            f.write("positive examples\n")
            f.write("\n".join(traces))
    


with open("./result.txt") as f:
    methodSet = set()
    userList = list()
    userarrMap = dict()
    userFrequences = dict()
    lines = f.readlines()
    for line in lines:
        user, function, status = tuplize(line)
        
        if user not in userFrequences:
            userFrequences[user] = 1
        else:
            userFrequences[user] += 1

        if function not in methodSet:
            methodSet.add(function)
        if user not in userarrMap:
            userarrMap[user] = dict()
        if function not in userarrMap[user]:
            userarrMap[user][function] = status
        else: 
            if status==1 :
                userarrMap[user][function] = status

    ### generate global array
    arr2D = list()
    for user in userarrMap:
        userList.append(user)
        arr1D = list()
        for method in sorted(list(methodSet)):
            if method in userarrMap[user]:
                arr1D.append(userarrMap[user][method])
            else:
                arr1D.append(0)
        arr2D.append(arr1D)
    
    nArr2D = np.array(arr2D)
    print(sorted(list(methodSet)))
    print(nArr2D.shape[0], nArr2D.shape[1])
    print(np.var(nArr2D[:,0]))
    print(nArr2D[0])
    divide(np.arange(nArr2D.shape[0]), nArr2D, 0)
    print("Groups number is ", Groups)   
    no = 1
    group_stat = []
    for group in groupList:
        representive = userList[group[0]]
        print("Group No.", no, ",",  len(group), "users", ": representative ",representive, userarrMap[representive])
        group_stat.append("group%d|%d|%s" % (no, len(group), ",".join(userarrMap[representive].keys())))
        drawDFA(no, group, userList, lines)
        no += 1
    drawHeadMergeDFA()
    
    drawPie(group_stat, "Diceether User Groups Based on Function Calling Patterns")

    lowfreq_users, mediumfreq_users, heavyfreq_users = freqDivide(userFrequences, 10, 50)
    group_stat = []
    group_stat.append("group%d|%d|%s" %(0, len(lowfreq_users), "users freq<10"))
    group_stat.append("group%d|%d|%s" %(1, len(mediumfreq_users), "users freq>=10 && freq<=50")) 
    group_stat.append("group%d|%d|%s" %(2, len(heavyfreq_users), "users freq>50"))
    print(heavyfreq_users, " representative: ",userarrMap[heavyfreq_users[1]])
    drawPie(group_stat, "Diceether User Groups Based on Transaction Frequence Patterns")
    