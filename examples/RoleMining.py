import numpy as np 
import pandas as pd 
import os 
import sys
import copy 
import networkx as nx 
import concepts
import matplotlib.pyplot as plt
import graphviz
from json import JSONEncoder
import json 
import pickle
import jsonpickle
import jsonpickle.handlers
import time 


class NodeHandler(jsonpickle.handlers.ArrayHandler):
    def flatten(self, obj, data):
            data["intent"] = obj.intent 
            data["extent"] = obj.extent
    def restore(self, obj, data):
        obj.indent = data["intent"]
        obj.extent = data["extent"]

class NodeEncoder(JSONEncoder):
    def default(self, object):
        if isinstance(object, Node):
            # print(object.__dict__)
            return {"extent": object.extent, "intent": object.intent}
        else:
            # call base class implementation which takes care of
            # raising exceptions for unsupported types
            return json.JSONEncoder.default(self, object)

class Node(object):
    def __init__(self, concept, intent, extent, isEmptyConcept=False):
        global counter
        self.concept = concept
        self.intent = intent
        self.extent = extent
        self.isEmptyConcept = isEmptyConcept

    def __str__(self):
        # return self.__dict__
        if self.isEmptyConcept == False:
            return "{0}\n---------\n{1}".format(str(self.intent), len(self.extent))
        else:
            return "{0}\n---------\n{1}".format("{}", len(self.extent))
    
    def __eq__(self,other):
        if other is None:
            return False
        
        return self.concept == other.concept or (self.intent == other.intent and self.extent == other.extent and self.isEmptyConcept ==other.isEmptyConcept)
    
    def __hash__(self):
        return hash(self.concept)

NodeDict = dict()
# HierarchyMiner
class HMLattice:
    def __init__(self, permissionMatrix):
        self.df = permissionMatrix
        self.permissions = list(permissionMatrix.columns)
        self.R = permissionMatrix.to_numpy()
        # self.U: number of object set, self.A: number of properties set
        self.U, self.A = self.R.shape 
        # Lattice
        self.L =  list()
        print(self.U, self.A)
    


    def lattice_graph(self, output):
        def Sen(r):
                return len(list(self.G.successors(r)))

        def Jun(r):
                return len(list(self.G.predecessors(r)))

        # Thr(r) is the set of pairs of roles (ri,rj) such that, without role r, ri would no longer be senior to rj
        def Thr(r): 
                root1, nodeDict1,  G1 = creatG()
                root2, nodeDict2,  G2 = creatG()
                G2.remove_node(r)
                return np.sum([ len(endnodes) for startnode, endnodes  in nx.algorithms.all_pairs_node_connectivity(G1).items()]) - np.sum([len(endnodes) for startnode, endnodes  in nx.algorithms.all_pairs_node_connectivity(G2).items()]) - len(list(self.G.successors(r))) - len(list(self.G.predecessors(r)))       
                

        if not os.path.exists("./roles"):
                os.mkdir("./roles")
        def creatG():
            NodeDict = dict()
            root = Node(self.c.lattice.supremum, self.c.lattice.supremum.intent, self.c.lattice.supremum.extent, isEmptyConcept=True)
            NodeDict[hash(self.c.lattice.supremum)] = root
            G = nx.DiGraph()
            def construct(root, graph, pre = None ):
                for subconcept in root.concept.lower_neighbors:
                    if hash(subconcept) not in NodeDict:
                        NodeDict[hash(subconcept)] = Node(subconcept, subconcept.intent, subconcept.extent)
                    subnode = NodeDict[hash(subconcept)]
                    root.extent = tuple(set(list(root.extent)).difference(set(list(subnode.extent))))
                    graph.add_edge(root, subnode)
                    # print(id(root), hash(root), id(subnode), hash(subnode))
                    construct(subnode, graph, root)
                return root
            def reduceg(root, graph):
                global NodeDict
                if len(list(graph.successors(root)))==0:
                    return
                else:
                    for successor in graph.successors(root):
                        if hash(successor) not in NodeDict:
                            NodeDict[hash(successor)] = successor
                        successor = NodeDict[hash(successor)]
                        # print(id(successor), hash(successor), successor.intent)
                        reduceg(successor, graph)
                        successor.intent = tuple(set(list(successor.intent)).difference(set(list(root.intent))))
                        # print(id(successor), hash(successor), successor.intent)
                    return root
            rootNode = construct(root,  G)
            rootNode = reduceg(rootNode,  G)
            return root,NodeDict,G 

        root, NodeDict, self.G = creatG()
        # Wr, Wu, Wp, Wh, Wd = (6,1,1,1,1)
        Wr, Wu, Wp, Wh, Wd = (1,1,1,0,0)
        nx.nx_pydot.write_dot(self.G, "./roles/HMLattice-ReduceLattice-"+ output+".dot")
        for h, node in NodeDict.items():
            if time.time()-self.start > 5*60:
                break 
            print(Sen(node), Jun(node), Thr(node))
            if len(node.extent) == 0 and len(node.intent) == 0:
                if Wh*(Sen(node) + Jun(node))+Wr >= Wh*Thr(node):
                    predecessors = self.G.predecessors(node)
                    successors =  self.G.successors(node)
                    self.G.remove_node(node)
                    for predecessor in predecessors:
                        for successor in successors:
                            if successor not in self.G.successors(predecessor):
                                self.G.add_edge(predecessor, successor)
                    
            elif len(node.extent)!=0 and len(node.intent)==0:
                if Wr + Wu * self.U + Wh * (Sen(node) + Jun(node)) >= Wu * self.U * Jun(node) + Wh * Thr(node):
                    extent = node.extent
                    predecessors = self.G.predecessors(node)
                    successors = self.G.successors(node)
                    thr_pairs = list()
                    for startnode, endnodes in nx.algorithms.all_pairs_node_connectivity(self.G).items():
                        for endnode in endnodes:
                            if (startnode, endnode) not in thr_pairs:
                                thr_pairs.append((startnode, endnode))
                    self.G.remove_node(node)
                    for startnode, endnodes in nx.algorithms.all_pairs_node_connectivity(self.G).items():
                        for endnode in endnodes:
                            if (startnode, endnode) in thr_pairs:
                                thr_pairs.remove((startnode, endnode))
                    for predecessor in predecessors:
                        thr_pairs.remove((predecessor, node))
                    for successor in successors:
                        thr_pairs.remove((node, successor))
                        successor.extent = tuple(set(list(extent)).union(set(list(successor.extent))))
                    for startnode, endnode in thrpairs:
                        self.G.add_edge(startnode, endnode)
            elif len(node.extent) == 0 and len(node.intent)>0:
                if Wr + Wp * self.A + Wh * (Sen(node) + Jun(node)) >= Wp * self.A * Sen(node) + Wh * Thr(node):
                    intent = node.intent
                    predecessors = self.G.predecessors(node)
                    successors = self.G.successors(node)
                    thr_pairs = list()
                    for startnode, endnodes in nx.algorithms.all_pairs_node_connectivity(self.G).items():
                        for endnode in endnodes:
                            if (startnode, endnode) not in thr_pairs:
                                thr_pairs.append((startnode, endnode))
                    self.G.remove_node(node)
                    for startnode, endnodes in nx.algorithms.all_pairs_node_connectivity(self.G).items():
                        for endnode in endnodes:
                            if (startnode, endnode) in thr_pairs:
                                thr_pairs.remove((startnode, endnode))
                    for predecessor in predecessors:
                        thr_pairs.remove((predecessor, node))
                        predecessor.intent = tuple(set(list(predecessor.intent)).union(set(list(intent))))
                    for successor in successors:
                        thr_pairs.remove((node, successor))

                    for startnode, endnode in thr_pairs:
                        self.G.add_edge(startnode, endnode)
        nx.nx_pydot.write_dot(self.G, "./roles/HMLattice-HierarchyRole-"+ output+".dot")
        if not os.path.exists("./roles/roleNumStatistics.csv"):
            with open("./roles/roleNumStatistics.csv", "w") as f:
                f.write("Dapp, Number of Roles, Used Time \n")     
        with open("./roles/roleNumStatistics.csv", "a+") as f:
            f.write("{0}, {1}, {2}\n".format(output, str(len(self.G.nodes.items())), '{:.2f}'.format(time.time()-self.start))) 
        
        return


    def reduceAndprune_lattice(self):
        return 

        
    def output(self, output):
        if not os.path.exists("./roles"):
                os.mkdir("./roles")
        if output is not None:
            with open("./roles/HMLattice-"+ output+".txt", "w") as f:
                f.write("\n".join(["({0}):{1}".format(",".join(intent), len(extent)) for  extent, intent in self.c.lattice]))
        else:
            with open("./roles/HMLattice-roles.txt", "w") as f:
                f.write("\n".join(["({0}):{1}".format(",".join(intent), len(extent)) for  extent, intent in self.c.lattice]))

    def process(self, output):
        self.start  = time.time()

        objects = map(lambda id: str(id),self.df.index.tolist())
        properties = list(self.df)
        bools = list(self.df.fillna(False).astype(bool).itertuples(index=False, name=None))
    
        c = concepts.Context(objects, properties, bools)
        self.c = c 
        self.c.lattice.graphviz(filename="./roles/HMLattice-"+output+".dot", view=False, make_object_label=lambda object:"")
        
        
        self.lattice_graph(output)
        self.output(output)

        
    

# HP Role Minimization
class HPr:
    def __init__(self, permissionMatrix):
        self.permissions = list(permissionMatrix.columns)
        self.userPermission = permissionMatrix.to_numpy()
        self.usernumber, self.permissionnumber = self.userPermission.shape 
        self.roles = list()
        print(self.usernumber, self.permissionnumber)
    
    def initalize(self):
        self.coveredpermission = set()
        self.covereduser = set()

    def process(self, output):
        self.initalize()
        self.strategy_chooseuser_fewestuncoveredpermissions()
        self.strategy_choosepermission_fewestuncoveredusers()
        self.output(output)
    
    def output(self, output):
        if not os.path.exists("./roles"):
                os.mkdir("./roles")
        if output is not None:
            with open("./roles/HPr-"+ output+".txt", "w") as f:
                f.write("\n".join(["({0}):{1}".format(",".join(role[1]), len(role[0])) for role in self.roles]))
        else:
            with open("./roles/HPr-roles.txt", "w") as f:
                f.write("\n".join(["({0}):{1}".format(",".join(role[1]), len(role[0])) for role in self.roles]))


    def strategy_choosepermission_fewestuncoveredusers(self):
        while True:
            permissionUserCount = None 
            for i in range(len(self.permissions)):
                if self.permissions[i] not in self.coveredpermission:
                    if permissionUserCount is None:
                        permissionUserCount = np.sum(self.userPermission[:,])
                    else:
                        permissionUserCount = min(permissionUserCount, np.sum(self.userPermission[:,]))
            if permissionUserCount is None:
                break
            for i in range(len(self.permissions)):
                if self.permissions[i] not in self.coveredpermission:
                    if permissionUserCount == np.sum(self.userPermission[:,]):
                        role = (self.Up(i),self.Pp(i))
                        self.roles.append(role)
                        for u in role[0]:
                            self.covereduser.add(u)
                        for p in role[1]:
                            self.coveredpermission.add(p)
                        break

    def strategy_chooseuser_fewestuncoveredpermissions(self):
        while True:
            userpermissionCount = None 
            for user in range(self.usernumber):
                if user not in self.covereduser:
                    if userpermissionCount is None:
                        userpermissionCount = np.sum(self.userPermission[user])
                    else:
                        userpermissionCount = min(userpermissionCount, np.sum(self.userPermission[user]))
            if userpermissionCount is None:
                break
            for user in range(self.usernumber):
                if user not in self.covereduser:
                    if userpermissionCount == np.sum(self.userPermission[user]):
                        role = (self.Uu(user),self.Pu(user))
                        self.roles.append(role)
                        for u in role[0]:
                            self.covereduser.add(u)
                        for p in role[1]:
                            self.coveredpermission.add(p)
                        break
    # get permission sets of user#u                    
    def Pu(self, u):
        permissions = set()
        for i in range(len(self.userPermission[u])):
            if self.userPermission[u][i]==1:
                permissions.add(self.permissions[i])
        return permissions

    # get all users who have all of user#u's permissions
    def Uu(self, u):
        users = set()
        permissions = self.Pu(u)
        assert len(permissions)>0, "permission set is empty"
        for user in range(self.usernumber):
            user_permissions = set()
            [user_permissions.add(self.permissions[i]) if self.userPermission[user][i]==1 else "" for i in range(len(self.userPermission[user]))]
            # test if user_permissions are subset of permissions
            if len(user_permissions.intersection(permissions)) == len(permissions):
                users.add(user)
        return users
    
    # get all permissions assigned to all users in Up(p)
    def Pp(self, p):
        permissions = set()
        users = self.Up(p)
        assert len(users)>0, "users set is empty"
        for user in users:
            user_permissions = set()
            [user_permissions.add(self.permissions[i]) if self.userPermission[user][i]==1 else "" for i in range(len(self.userPermission[user]))]
            permissions = permissions.union(user_permissions)
        return permissions
    # get all users who have permission#p
    def Up(self, p):
        users = set()
        for i in range(len(self.userPermission[:,p])):
            if self.userPermission[i][p]==1:
                users.add(i)
        return users 
    



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
            with open("./roles/orca-"+ output+".txt", "w") as f:
                f.write("\n".join([ "({0})".format(",".join(cluster)) for cluster in self.removeClusters]))
                f.write("\n")
                f.write("\n".join([ "({0})".format(",".join(cluster)) for cluster in self.Clusters]))
        else:
            with open("./roles/orca-roles.txt", "w") as f:
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
    #orca = ORCA(csvdata)
    #orca.process(options["output"])
    #hpr = HPr(csvdata)
    #hpr.process(options["output"])
    hm = HMLattice(csvdata)
    hm.process(options["output"])

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
