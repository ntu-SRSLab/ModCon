import os 
import numpy as  np
from tslearn.utils import to_time_series_dataset
from sklearn.datasets import make_blobs
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_samples, silhouette_score
import matplotlib.pyplot as plt
import matplotlib.cm as cm
from scipy import spatial
import math 
    
if not os.path.exists("./analysis"):
    os.mkdir("./analysis")

def tuplize(line):
    arr = line.strip().split(" ")
    # print(arr)
    # return
    # print(arr)
    # exit(0)
    #  user   function   status
    return arr[0], arr[1], 1 if arr[-1]=="success" else 0

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
headUsers = dict()
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
                headUsers[trace[0]] = set()
            headTraces[trace[0]].append(trace)
            headUsers[trace[0]].add(user)

    if len(alphabet)>0:
        with open("./analysis/group"+str(groupNo)+".txt","w") as f:
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
        with open("./analysis/group-"+head+".txt","w") as f:
            f.write("alphabet\n")
            f.write("\n".join(alphabet))
            f.write("\n---------------------\n")
            f.write("positive examples\n")
            f.write("\n".join(traces))

def cluster_analysis(X, userList, userarrMap):
    range_n_clusters = range(2, 10)

    for n_clusters in range_n_clusters:
        # Create a subplot with 1 row and 2 columns
        fig, ax1 = plt.subplots(1, 1)
        fig.set_size_inches(18, 7)

        # The 1st subplot is the silhouette plot
        # The silhouette coefficient can range from -1, 1 but in this example all
        # lie within [-0.1, 1]
        ax1.set_xlim([-0.1, 1])
        # The (n_clusters+1)*10 is for inserting blank space between silhouette
        # plots of individual clusters, to demarcate them clearly.
        ax1.set_ylim([0, len(X) + (n_clusters + 1) * 10])

        # Initialize the clusterer with n_clusters value and a random generator
        # seed of 10 for reproducibility.
        clusterer = KMeans(n_clusters=n_clusters, random_state=10)
        cluster_labels = clusterer.fit_predict(X)

        # The silhouette_score gives the average value for all the samples.
        # This gives a perspective into the density and separation of the formed
        # clusters
        silhouette_avg = silhouette_score(X, cluster_labels)
        print("For n_clusters =", n_clusters,
            "The average silhouette_score is :", silhouette_avg)

        # Compute the silhouette scores for each sample
        sample_silhouette_values = silhouette_samples(X, cluster_labels)

        y_lower = 10
        for i in range(n_clusters):
            # Aggregate the silhouette scores for samples belonging to
            # cluster i, and sort them
            ith_cluster_silhouette_values = \
                sample_silhouette_values[cluster_labels == i]

            ith_cluster_silhouette_values.sort()

            size_cluster_i = ith_cluster_silhouette_values.shape[0]
            y_upper = y_lower + size_cluster_i

            color = cm.nipy_spectral(float(i) / n_clusters)
            ax1.fill_betweenx(np.arange(y_lower, y_upper),
                            0, ith_cluster_silhouette_values,
                            facecolor=color, edgecolor=color, alpha=0.7)

            # Label the silhouette plots with their cluster numbers at the middle
            ax1.text(-0.05, y_lower + 0.5 * size_cluster_i, str(i))

            # Compute the new y_lower for next plot
            y_lower = y_upper + 10  # 10 for the 0 samples

        ax1.set_title("The silhouette plot for the various clusters.")
        ax1.set_xlabel("The silhouette coefficient values")
        ax1.set_ylabel("Cluster label")

        # The vertical line for average silhouette score of all the values
        ax1.axvline(x=silhouette_avg, color="red", linestyle="--")

        ax1.set_yticks([])  # Clear the yaxis labels / ticks
        ax1.set_xticks([-0.1, 0, 0.2, 0.4, 0.6, 0.8, 1])

        plt.suptitle(("Silhouette analysis for KMeans clustering on sample data "
                    "with n_clusters = %d" % n_clusters),
                    fontsize=14, fontweight='bold')

        plt.show()

def to_kernel_dataset(X):
    d2 = np.max([ len(ls) for ls in X])
    for ls in X:
        if len(ls) < d2:
            length = len(ls)
            ls.extend([ -1 for i in range(length, d2)])
    return X

def print_trace(x):
    global methodList
    # global methodId
    x = x[1:]
    x = list(filter(lambda item: item!=-1,x))
    trace = [ methodList[int(item)] for item in x]
    print(" ".join(trace))

def duration_similarity(x, y):
    global userId
    global userDurations
    global variance
  
    user1 = userId[int(x[0])]
    user2 = userId[int(y[0])]
    duration1 = userDurations[user1]
    duration2 = userDurations[user2]
   
    # return 1- spatial.distance.cosine(duration1, duration2)
    return math.exp(-(spatial.distance.euclidean(duration1, duration2))**2/variance)

def frequence_similarity(x, y):
    global methodFrequence

    pass 

def featureSet_commonstring_similarity(x, y):
    global LIMIT
    global print_no
    x = set(x)
    y = set(y)
    commons = x.intersection(y)
    sim1 = len(list(filter(lambda  item: item in commons, x)))/len(x)
    sim2 = len(list(filter(lambda  item: item in commons, y)))/len(y)
    return max(sim1, sim2)

def featureSet_euclid(x ,y):
    x = set(x)
    y = set(y)
    overall_features = x.union(y)

    v1 = [0 for feature in overall_features]
    v2 = [0 for feature in overall_features]
    no = 0
    for feature in overall_features:
        if feature in x:
            v1[no] = 1
        if feature in y:
            v2[no] = 1
        no += 1
    return spatial.distance.euclidean(v1, v2)

def feature_similarity(x, y):
    x = x[1:]
    y = y[1:]
    x1 = list(filter(lambda item: int(item)!=-1,x))
    y1 = list(filter(lambda item: int(item)!=-1,y))
    
    return 1/4*1/(1+featureSet_euclid(x1,y1))+3/4*featureSet_commonstring_similarity(x1, y1)

def synonym_similarity(x, y):
    global methodList
    global methodId
    x = x[1:]
    y = y[1:]
    x1 = list(filter(lambda item: int(item)!=-1,x))
    y1 = list(filter(lambda item: int(item)!=-1,y))
    try:
        x1 = list(map( lambda item: 
        float(methodId["oboCreateDigitalMediaReleases"]) if methodList[int(item)] == "oboCreateDigitalMediaAndReleases" else 
        float(methodId["burn"]) if methodList[int(item)] == "burnToken" else
        float(methodId["transferFrom"]) if methodList[int(item)] == "safeTransferFrom" else
        item, x1
        ))
        
        y1 = list(map( lambda item: 
        float(methodId["oboCreateDigitalMediaReleases"]) if methodList[int(item)] == "oboCreateDigitalMediaAndReleases" else 
        float(methodId["burn"]) if methodList[int(item)] == "burnToken" else
        float(methodId["transferFrom"]) if methodList[int(item)] == "safeTransferFrom" else
        item, y1
        ))
    except IndexError as e:
        print(x1)
        print(y1)
        print(methodList)
        print(e)
        raise e

    return 1/4*1/(1+featureSet_euclid(x1,y1))+3/4*featureSet_commonstring_similarity(x1, y1)

def order_similarity(x, y):
   

    pass 

def contex_similarity(x,y):
    pass 

def prerequisites_similarity(x, y):
    pass 

LIMIT = 30
print_no = 0

Probs_set = [
    [1/16, 7/16, 8/16],
    [2/16, 6/16, 8/16],
    
    [1/16, 8/16, 7/16],
    [2/16, 7/16, 7/16],
    [3/16, 6/16, 7/16],
    
    [1/16, 9/16, 6/16],
    [2/16, 8/16, 6/16],
    [3/16, 7/16, 6/16],
    
    [1/16, 10/16, 5/16],
    [2/16, 9/16, 5/16],
    [3/16, 8/16, 5/16],
    
    [1/16, 12/16,  3/16],
    [2/16, 11/16,  3/16],
    [3/16, 10/16,  3/16],
    ]
Probs = list()
def naive_kernel(x, y):
    global Probs
    global LIMIT
    global print_no
    f_sim = feature_similarity(x,y)
    syn_sim = synonym_similarity(x,y)
    dur_sim = duration_similarity(x, y)
    # sim = 2/16*f_sim + 8/16* syn_sim + 6/16* dur_sim
    sim = Probs[0]*f_sim + Probs[1]* syn_sim + Probs[2]* dur_sim
    if syn_sim!=f_sim  and print_no < LIMIT:
        print_trace(x)
        print_trace(y)
        print("simlarity: ", sim,  f_sim, syn_sim, dur_sim)
        print("***********")
        print_no += 1
    return sim
def drawPie(group_stat, pie_title):
    import matplotlib.pyplot as plt

    # print(group_stat)
    fig, ax = plt.subplots(
    # figsize=(6, 3), 
    subplot_kw=dict(aspect="equal"))

    data = [float(x.split("|")[1]) for x in group_stat]
    print(data)
    explode = tuple([0.0 if data[i]/np.max(np.array(data)) > 0.01 else 0.4  for i in range(len(data))])

    groups = [x.split("|")[-1] for x in group_stat]


    def func(pct, allvals):
        absolute = (pct/100.*np.sum(allvals))
        # print("{:.1f}%\n({:d} )".format(pct, math.ceil(absolute)))
        return "{:.1f}%\n({:d} )".format(pct, math.ceil(absolute))


    wedges, texts, autotexts = ax.pie(data, explode=None, autopct=lambda pct: func(pct, data),
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

def drawKMEANS(size, kmeans, userList):
    global userarrMap
    labels = kmeans.labels_
    # print(labels)
    # print(len(userList), len(labels))
    groupList = []
    def getTrace(cluster):
        trace = set()
        for user in cluster:
            # print(userarrMap[userList[user]], kmeans.predict([X[user]]))
            trace.update(filter(lambda key: userarrMap[userList[user]][key]>0,userarrMap[userList[user]].keys()))    
        return trace
        
    for cluster in range(size):
        groupList.append(list(filter(lambda  index: labels[index]==cluster, range(len(labels)))))
    group_stat = []
    no = 0
    for group in groupList:
        representive = userList[group[0]]
        print("Group No.", no, ",",  len(group), "users", ": representative ",representive, userarrMap[representive])
        group_stat.append("group%d|%d|%s" % (no, len(group), " ".join(getTrace(group))))
        no += 1
    drawPie(group_stat, "MakersPlace User Groups")
    
def kernel_cluster(X, userList, userarrMap, SIZE = 3, kernel = None):
    from tslearn.clustering import KernelKMeans
    from tslearn.clustering import TimeSeriesKMeans 
    
    if kernel==None:
        from sklearn.cluster import KMeans
        kmeans = KMeans(n_clusters=SIZE, algorithm="elkan"  ,random_state=0).fit(X)
        # print(kmeans.labels_)
        print("****************************************")
        print("K-Means.")
        for  cluster_id in range(SIZE):
                    cluster = list(filter(lambda key: kmeans.labels_[key] == cluster_id, range(len(kmeans.labels_))))
                    no = 0
                    trace = set()
                    for user in cluster:
                        # print(userarrMap[userList[user]], kmeans.predict([X[user]]))
                        trace.update(filter(lambda key: userarrMap[userList[user]][key]>0,userarrMap[userList[user]].keys()))    
                    
                    print("cluster: ", cluster_id, " size: ", len(cluster), "function set:", trace)
    elif kernel=="time series":
            print("****************************************")
            print("current kernel: ",kernel)
            kmeans = TimeSeriesKMeans(n_clusters=SIZE, metric="dtw", random_state=0).fit(X)
            # print(kmeans.labels_)
            for  cluster_id in range(SIZE):
                        cluster = list(filter(lambda key: kmeans.labels_[key] == cluster_id, range(len(kmeans.labels_))))
                        no = 0
                        trace = set()
                        for user in cluster:
                            # print(userarrMap[userList[user]], kmeans.predict([X[user]]))
                            trace.update(filter(lambda key: userarrMap[userList[user]][key]>0,userarrMap[userList[user]].keys()))    
                        
                        print("cluster: ", cluster_id, " size: ", len(cluster), "function set:", trace)
    else:
            print("****************************************")
            print("current kernel: ",kernel)
            kmeans =  KernelKMeans(n_clusters=SIZE, kernel=kernel ,random_state=0).fit(X)
            # print(kmeans.labels_)
            for  cluster_id in range(SIZE):
                        cluster = list(filter(lambda key: kmeans.labels_[key] == cluster_id, range(len(kmeans.labels_))))
                        no = 0
                        trace = set()
                        for user in cluster:
                            # print(userarrMap[userList[user]], kmeans.predict([X[user]]))
                            trace.update(filter(lambda key: userarrMap[userList[user]][key]>0,userarrMap[userList[user]].keys()))    
                        
                        print("cluster: ", cluster_id, " size: ", len(cluster), "function set:", trace)


methodSet = set()
methodList = list()
userList = list()
userarrMap = dict()
userFrequences = dict()
# record usage trace for each user
userTraces  = dict()
userMethodFrequence = dict()
methodFrequence = dict()
userDurations = dict()
methodId = dict()
userId = dict()
variance = 0
def  testTotalDurationsTotalTransactionsUsingKernel():
    global Probs_set
    global Probs
    global methodList
    global methodSet
    global userId
    global methodId
    global userDurations
    global variance
    global userTraces
    global userarrMap
    global userFrequences
    global userMethodFrequence
    with open("./txResult.txt") as f:
        lines = f.readlines()[1:]
        for line in lines:
            user, function, status = tuplize(line)
            if status==1 :
                if user not in userFrequences:
                    userFrequences[user] = 1
                    userMethodFrequence[user] = dict()
                else:
                    userFrequences[user] += 1
                
                if function not in userMethodFrequence[user]:
                    userMethodFrequence[user][function] = 1
                    methodFrequence[function] = 1
                else: 
                    methodFrequence[function] += 1
                    userMethodFrequence[user][function] += 1

                if function not in methodSet:
                    methodSet.add(function)
                if user not in userarrMap:
                    userarrMap[user] = dict()
                if function not in userarrMap[user]:
                    userarrMap[user][function] = status
                else: 
                    userarrMap[user][function] = status
        methodList =list(methodSet)
      
        # fetch all user reduced traces
        # with open("usertrace_reduced.txt") as f:
        with open("userTrace.txt") as f:
            userTraces = dict()
            lines = f.readlines()
            for line in lines:
                user = line.strip().split(" ")[0]
                trace = line.strip().split(" ")[1:]
                if len(trace)>20:
                    trace = trace[:20]
                userTraces[user] = trace
    

        # fetch total durations, total transactions
        with open("userDuration.txt") as f:
            lines = f.readlines()[1:]
            durations = []
            for line in lines:
                user = line.strip().split(" ")[0]
                userDurations[user] = list(map(lambda v: float(v), line.strip().split(" ")[1:]))
                durations.append(userDurations[user])
            duration_avg = np.zeros(len(durations[0]))
            for duration in durations:
                duration_avg = np.add(duration_avg, duration)
            duration_avg =  duration_avg / len(durations)
            # print("average: ", duration_avg)
            variance = np.sum([ spatial.distance.euclidean(duration_avg, duration)**2 for duration in durations])/(len(durations)-1)
            print("variance: ", variance)
         
        # normalize method frequence to [0,1]
        gak_arr2D = list()
        no = 0
        for method in methodList:
            methodId[method] = no
            no += 1 
        print(methodId, methodList)

        no = 0
        # encode each method using integer id
        for user in userTraces:
            userList.append(user)
            userId[no] = user
            arr = [no]
            arr.extend([ methodId[method] for method in userTraces[user]])
            gak_arr2D.append(arr)
            no += 1
        for probs in Probs_set:
            Probs = probs
            print("Probability: ",Probs)
            for size in [3, 4, 5]:
                kmeans  = kernel_cluster(to_kernel_dataset(gak_arr2D), userList, userarrMap, SIZE = size, kernel=naive_kernel)
                drawKMEANS(size, kmeans, userList)
    pass 


def  testFullDurations():
 
    global methodList
    global methodSet
    global userId
    global methodId
    global userDurations
    global variance
    global userTraces
    global userarrMap
    global userFrequences
    global userMethodFrequence
    with open("./txResult.txt") as f:
        lines = f.readlines()[1:]
        for line in lines:
            user, function, status = tuplize(line)
            if status==1 :
                if user not in userFrequences:
                    userFrequences[user] = 1
                    userMethodFrequence[user] = dict()
                else:
                    userFrequences[user] += 1
                
                if function not in userMethodFrequence[user]:
                    userMethodFrequence[user][function] = 1
                    methodFrequence[function] = 1
                else: 
                    methodFrequence[function] += 1
                    userMethodFrequence[user][function] += 1

                if function not in methodSet:
                    methodSet.add(function)
                if user not in userarrMap:
                    userarrMap[user] = dict()
                if function not in userarrMap[user]:
                    userarrMap[user][function] = status
                else: 
                    userarrMap[user][function] = status
        methodList = list(methodSet)
        with open("userDuration.txt") as f:
            lines = f.readlines()[1:]
            full_durations = dict()
            for line in lines:
                user = line.strip().split(" ")[0]
                full_durations[user] = list(map(lambda v: float(v), line.strip().split(" ")[1:]))
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
            arr1D.extend(full_durations[user])
            arr2D.append(arr1D)
        
        Arr2D = np.array(arr2D)
        
        nArr2D = Arr2D / Arr2D.max(axis=0)
        print(Arr2D[1], nArr2D[1])
       
        for size in [2, 3, 4, 5, 6, 7, 8]:
                kernel_cluster(nArr2D, userList, userarrMap, SIZE = size)
    pass 


if __name__ == "__main__":
    # testFullDurations()
    testTotalDurationsTotalTransactionsUsingKernel()
    
     



    