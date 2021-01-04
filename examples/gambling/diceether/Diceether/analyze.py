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

def cluster_analysis(X, userList, userarrMap):
    from sklearn.datasets import make_blobs
    from sklearn.cluster import KMeans
    from sklearn.metrics import silhouette_samples, silhouette_score

    import matplotlib.pyplot as plt
    import matplotlib.cm as cm
    range_n_clusters = [2, 3, 4, 5, 6]

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

def kernel_cluster(X, userList, userarrMap, SIZE = 3):
    from tslearn.clustering import KernelKMeans 

    # SIZE = 3
    for kernel in ['gak','additive_chi2', 'chi2', 'linear', 'poly', 'polynomial', 'rbf', 'laplacian', 'sigmoid', 'cosine']:
        print("****************************************")
        print("current kernel: ",kernel)
        kmeans = KernelKMeans(n_clusters=SIZE, kernel=kernel ,random_state=0).fit(X)
        # print(kmeans.labels_)
        for  cluster_id in range(SIZE):
                    cluster = list(filter(lambda key: kmeans.labels_[key] == cluster_id, range(len(kmeans.labels_))))
                    no = 0
                    trace = set()
                    for user in cluster:
                        # print(userarrMap[userList[user]], kmeans.predict([X[user]]))
                        trace.update(userarrMap[userList[user]].keys())    
                        # no += 1
                        # if no>15:
                        #     break
                    print("cluster: ", cluster_id, " size: ", len(cluster), "function set:", trace)
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
                    trace.update(userarrMap[userList[user]].keys())    
                    # no += 1
                    # if no>15:
                    #     break
                print("cluster: ", cluster_id, " size: ", len(cluster), "function set:", trace)
    # exit(0)

def cluster(X, userList, userarrMap):
    cluster_analysis(X, userList, userarrMap)
    from sklearn.cluster import KMeans
    import matplotlib.pyplot as plt
    kmeans = KMeans(n_clusters=4, algorithm="elkan", random_state=0).fit(X)
    print("labels:", kmeans.labels_)
    sse = []
    list_k = list(range(1, 10))

    for k in list_k:
        kmeans = KMeans(n_clusters=k).fit(X)
        sse.append(kmeans.inertia_)
        for  cluster_id in range(k):
                cluster = list(filter(lambda key: kmeans.labels_[key] == cluster_id, range(len(kmeans.labels_))))
                no = 0
                for user in cluster:
                    print(userarrMap[userList[user]], kmeans.predict([X[user]]))
                    no += 1
                    if no>15:
                        break
                print("cluster: ", cluster_id, " size: ", len(cluster))

    plt.figure(figsize=(6, 6))
    plt.plot(list_k, sse, '-o')
    plt.xlabel(r'Number of clusters *k*')
    plt.ylabel('Sum of squared distance')
    plt.show()
    exit(0)

with open("./result.txt") as f:
    methodSet = set()
    userList = list()
    userarrMap = dict()
    userFrequences = dict()
    # record usage trace for each user
    userTraces  = dict()

    userMethodFrequence = dict()
    methodFrequence = dict()

    lines = f.readlines()
    for line in lines:
        user, function, status = tuplize(line)
        if status==1 :
            if user not in userFrequences:
                userFrequences[user] = 1
                userTraces[user] = list()
                userMethodFrequence[user] = dict()
            else:
                userFrequences[user] += 1
            userTraces[user].append(function)

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

    # print all user traces
    with open("usertrace.txt", "w") as f:
        for user in userTraces:
            f.write("%s %s\n" %(user, " ".join(userTraces[user])))

    # normalize method frequence to [0,1]
    prob_arr2D = list()
    for user in userMethodFrequence:
        userList.append(user)
        arr1D = list()
        for method in sorted(list(methodSet)):
            if method in userMethodFrequence[user]:
                arr1D.append((userMethodFrequence[user][method]/methodFrequence[method])*np.sum([ 1 if  method in userMethodFrequence[user] else 0 for user in userMethodFrequence]))
            else:
                arr1D.append(0)
        prob_arr2D.append(arr1D)
    # print(prob_arr2D)
    kernel_cluster(np.array(prob_arr2D), userList, userarrMap, SIZE = 3)
    print("************************************")
    print("************************************")
    print("************************************")
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
    # cluster(nArr2D, userList, userarrMap)
    kernel_cluster(nArr2D, userList, userarrMap)

    # divide(np.arange(nArr2D.shape[0]), nArr2D, 0)
    # print("Groups number is ", Groups)   
    # no = 1
    # group_stat = []
    # for group in groupList:
    #     representive = userList[group[0]]
    #     print("Group No.", no, ",",  len(group), "users", ": representative ",representive, userarrMap[representive])
    #     group_stat.append("group%d|%d|%s" % (no, len(group), ",".join(userarrMap[representive].keys())))
    #     drawDFA(no, group, userList, lines)
    #     no += 1
    # drawHeadMergeDFA()
    
    # drawPie(group_stat, "Diceether User Groups Based on Function Calling Patterns")

    # lowfreq_users, mediumfreq_users, heavyfreq_users = freqDivide(userFrequences, 10, 50)
    # group_stat = []
    # group_stat.append("group%d|%d|%s" %(0, len(lowfreq_users), "users freq<10"))
    # group_stat.append("group%d|%d|%s" %(1, len(mediumfreq_users), "users freq>=10 && freq<=50")) 
    # group_stat.append("group%d|%d|%s" %(2, len(heavyfreq_users), "users freq>50"))
    # print(heavyfreq_users, " representative: ",userarrMap[heavyfreq_users[1]])
    # drawPie(group_stat, "Diceether User Groups Based on Transaction Frequence Patterns")
    