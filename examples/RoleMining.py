import numpy as np 
import pandas as pd 
import os 
import sys
class ORCA:
    def __init__(self, permissionMatrix):
        self.Clusters = list()
        self.exclusiveClusterPair = list()
        self.removeClusters = list()
        self.PartialOrderOfClusters = set()
        self.permissions = list(permissionMatrix.columns)
        self.userPermission = permissionMatrix.to_numpy()
        # print(self.permissions)
    def getPermissionIndex(self, permission):
        for i in range(len(self.permissions)):
            if self.permissions[i] == permission:
                return i
        raise permission+" is out of permission range!"
    def members(self, cluster):
        if isinstance(cluster, set):
            mbs = None
            for item in cluster:
                tmp = self.members(item)
                if mbs is None:
                    mbs = tmp 
                else:
                    mbs = mbs.intersection(tmp)
            # print(cluster if mbs is None else "")
            assert mbs is not None, self.Clusters 
            return mbs
        else:
            mbs = set()
            permission = cluster 
            usersOfPermission = self.userPermission[:,self.getPermissionIndex(permission)]
            for user in range(len(usersOfPermission)):
                if usersOfPermission[user] == 1:
                    mbs.add(user)
            
            return mbs 

    def rights(self, cluster):
        if isinstance(cluster, set):
            rts = None
            for item in cluster:
                tmp = self.rights(item)
                if rts is None:
                    rts = tmp 
                else:
                    rts = rts.union(tmp)
            return rts
        else:
            permission = cluster
            rts = set()
            rts.add(permission)
            return rts  

    def newcluster(self, cluster_a, cluster_b):
        cluster = set()
        if isinstance(cluster_a, set):
            cluster = cluster.union(cluster_a)
        else:
            cluster.add(cluster_a)
        if isinstance(cluster_b, set):
            cluster = cluster.union(cluster_b)
        else:
            cluster.add(cluster_b)
        return cluster

    def less(self, cluster_a, cluster_b):
        if isinstance(cluster_b, set) and isinstance(cluster_a, str):
            return cluster_a in cluster_b
        elif isinstance(cluster_a, set) and isinstance(cluster_b, set):
            for item in cluster_a:
                if item not in cluster_b:
                    return False
            return len(cluster_a) <= len(cluster_b)
        return cluster_a!=cluster_b

    def initalize(self):
        [self.Clusters.append(set([permission])) for permission in self.permissions]
        # print(self.Clusters)
        for cluster_a in self.Clusters:
                for cluster_b in self.Clusters:
                    assert cluster_a is not None
                    assert cluster_b is not None
    
    def mining(self):
        while True:
            m = 0
            for cluster_a in self.Clusters:
                for cluster_b in self.Clusters:
                    if not ( cluster_a ==  cluster_b or cluster_a.union(cluster_b) in self.exclusiveClusterPair or self.less(cluster_a, cluster_b) or self.less(cluster_b, cluster_a)):
                        m = max(m, len(self.members(cluster_a).intersection(self.members(cluster_b))))
            if m == 0:
                break
            r = 0
            for cluster_a in self.Clusters:
                for cluster_b in self.Clusters:
                    if not ( cluster_a ==  cluster_b or cluster_a.union(cluster_b) in self.exclusiveClusterPair or self.less(cluster_a, cluster_b) or self.less(cluster_b, cluster_a)):
                        if m ==  len(self.members(cluster_a).intersection(self.members(cluster_b))):
                            r = max(r, len(self.rights(cluster_a).intersection(self.rights(cluster_b))))
            for cluster_a in self.Clusters:
                for cluster_b in self.Clusters:
                    if not ( cluster_a ==  cluster_b or cluster_a.union(cluster_b) in self.exclusiveClusterPair or self.less(cluster_a, cluster_b) or self.less(cluster_b, cluster_a)):
                        if m ==  len(self.members(cluster_a).intersection(self.members(cluster_b))) and r == len(self.rights(cluster_a).intersection(self.rights(cluster_b))):
                            # print(cluster_a, cluster_b)
                            cluster = self.newcluster(cluster_a, cluster_b)
                            if True:
                                print(cluster_a, cluster_b)
                                print(cluster)
                            self.Clusters.append(cluster)
                            self.Clusters.remove(cluster_a)
                            self.Clusters.remove(cluster_b)
                            self.exclusiveClusterPair.append(cluster_a.union(cluster_b))
                            self.removeClusters.append(["perform hierarchy"])
                            self.removeClusters.append(cluster_a)
                            self.removeClusters.append(cluster_b)
                            self.removeClusters.append(["****"])
                            break
        return 
    def output(self, output):
        if not os.path.exists("./roles"):
            os.mkdir("./roles")
        if output is not None:
            with open("./roles/"+ output+".txt", "w") as f:
                f.write("\n".join([ "({0})".format(",".join(cluster)) for cluster in self.removeClusters]))
                f.write("\n")
                f.write("\n".join([ "({0})".format(",".join(cluster)) for cluster in self.Clusters]))
        else:
            with open("./roles/hierarchy-roles.txt", "w") as f:
                f.write("\n".join([ "({0})".format(",".join(cluster)) for cluster in self.removeClusters]))
                f.write("\n")
                f.write("\n".join([ "({0})".format(",".join(cluster)) for cluster in self.Clusters]))
    def process(self, output):
        self.initalize()
        self.mining() 
        self.output(output)
cmdOpt = '''--------------------------------------------------------------
| Roles Mining for smart contract transactions on Ethereum |
--------------------------------------------------------------
    --help      usage help
    --input     input file
    --output    output file
    --rolemining enable role mining
'''                  

def main(options):
    # input_matrix_file = "./gambling/diceether/Diceether/userPermission.csv"
    input_matrix_file = options["input"]
    csvdata = pd.read_csv(input_matrix_file, sep=",", header=0)
    orca = ORCA(csvdata)
    orca.process(options["output"])

if __name__ == "__main__":
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
            elif args[i] == "--rolemining":
                options["rolemining"] = True 
                i += 1
            else:
                print("wrong program input; program input should be: ")
                print(cmdOpt)
                exit(0)
        except IndexError as e:
                print("wrong program input; program input should be: ")
                print(cmdOpt)
                exit(0)
    assert "input" in options, print(cmdOpt)
    assert "rolemining" in options, print(cmdOpt)
    main(options)