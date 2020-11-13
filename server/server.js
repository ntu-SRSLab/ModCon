var app = require('express')()
var http = require('http').Server(app)
var path = require('path');
const shell = require("shelljs");
const fs = require("fs");
var io = require('socket.io')(http)
var assert = require("assert")
var membershipQueryServer = require("./connection/protos/Server");
var compiler = require("./utils/compile");
var TransactionCacheTrie = require("./utils/TransactionTrie").TransactionCacheTrie;

var FiscoContractKit = require("./connection/fisco/fuzzer").FiscoDeployer;
var FiscoFuzzer = require("./connection/fisco/fuzzer").FiscoFuzzer;

var EthereumContractKit = require("./connection/ethereum/fuzzer").EthereumContractKit;
var EthereumFuzzer = require("./connection/ethereum/fuzzer").EthereumFuzzer;


const interpret = require("xstate").interpret;
const createModel = require("@xstate/test").createModel;
const aa = require("aa");

var SocketIOFileUpload = require('socketio-file-upload');
app.use(SocketIOFileUpload.router);
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);

  next();
})
app.get('/clients', (req, res) => {
  res.send(Object.keys(io.sockets.clients().connected))
})
// start  fisco-bcos network
shell.exec("cd ../fisco-bcos && ./quickstart.sh ");
// start  geth-ethereum network
// shell.exec("cd ../ethereum/geth-ethereum && ./quickstart.sh &",{async:true} );
shell.mkdir("-p","./uploads")
shell.mkdir("-p","./logs")

const event_Upload = "Upload";
const event_Compile = "Compile";
const event_Deploy = "Deploy";
const event_Transaction = "Transaction";

// state machine coverage stragety
const CoverState = "States";
const CoverTransition = "Transitions-Without-Loop";
const CoverTransitionLoop = "Transitions-With-Loop";

const MAX_COUNT = 60;

class FSMStrategyManager {
  constructor(socket, strategy) {
    assert(strategy == CoverState || strategy == CoverTransitionLoop || strategy == CoverTransition, `${strategy} is invalid`);
    this.strategy = strategy;
    this.socket = socket;
  }
  static getInstance(socket, strategy) {
    if (!FSMStrategyManager.instance || (strategy && strategy != FSMStrategyManager.instance.strategy))
      FSMStrategyManager.instance = new FSMStrategyManager(socket, strategy);
    return FSMStrategyManager.instance;
  }
  execute_strategy(machine) {
    let plans = undefined;
    if (CoverState == this.strategy) {
      plans = FSMStrategyManager.getInstance()._cover_states(machine);
    } else if (CoverTransition == this.strategy) {
      plans = FSMStrategyManager.getInstance()._cover_transitions_without_loop(machine);
    } else if (CoverTransitionLoop == this.strategy) {
      plans = FSMStrategyManager.getInstance()._cover_transitions_with_loop(machine);
    }
    return plans;
  }
  _cover_states(machine) {
    const toggleModel = createModel(machine);
    console.log(JSON.stringify(toggleModel)); // Do not remove this line otherwise there would be a covert null  error as for xstate.  The reason is unknown.
    // console.log(toggleModel); // Do not remove this line otherwise there would be a covert null  error as for xstate.  The reason is unknown.
    console.log("******************************");
    let plans = toggleModel.getShortestPathPlans();
    console.log("******************************");
    console.log("size of  covering state plans:", plans.length);
    return plans;
  }
  _cover_transitions_without_loop(machine) {
    const toggleModel = createModel(machine);
    console.log(JSON.stringify(toggleModel)); // Do not remove this line otherwise there would be a covert null  error as for xstate.  The reason is unknown.
    console.log("******************************");
    let plans = toggleModel.getSimplePathPlans();
    console.log("******************************");
    console.log("size of  covering transitions (without loop) plans:", plans.length);
    return plans;
  }
  _cover_transitions_with_loop(dummyMachine) {
    const toggleModel = createModel(dummyMachine);
    console.log(JSON.stringify(toggleModel)); // Do not remove this line otherwise there would be a covert null  error as for xstate.  The reason is unknown.
    console.log("******************************");
    let plans = toggleModel.getSimplePathPlans();
    console.log("******************************");
    console.log("size of  covering transitions (with loop) plans:", plans.length);
    return plans;
  }
}
class FSMTestCaseProrityManager {
  constructor(test_priority) {
    this.test_priority = test_priority;
  }
  static getInstance(test_priority) {
    if (!FSMTestCaseProrityManager.instance || FSMTestCaseProrityManager.instance.test_priority != test_priority) {
      FSMTestCaseProrityManager.instance = new FSMTestCaseProrityManager(test_priority);
    }
    return FSMTestCaseProrityManager.instance;
  }
  rearrange(plans) {
    var obj = this;
    console.log("test priority:", this.test_priority);
    // console.log("before:", plans);
    plans.sort(function (a, b) {
      let a1 = a.state.value == obj.test_priority.state;
      let a2 = a.paths.filter(path => {
        return path.description.indexOf(obj.test_priority.transition) != -1;
      }).length > 0;
      let b1 = b.state.value == obj.test_priority.state;
      let b2 = b.paths.filter(path => {
        return path.description.indexOf(obj.test_priority.transition) != -1;
      }).length > 0;
      console.log((a1 || a2) ? -1 :
        ((b1 || b2) ? 1 :
          0));
      return (a1 || a2) ? -1 :
        ((b1 || b2) ? 1 :
          0);
    });
    // console.log("after:", plans);
    return plans;
  }
}
// initialize,
// replay all transitions, 
// randomWalk transitions among different states even there is no legal transition.
class FSMStateReplayer {
  constructor(network) {
    this.network = network;
    if (!this.network || this.network == "fisco-bcos") {
      this.deployer = FiscoContractKit.getInstance("./deployed_contract");
    }
    if (this.network == "ethereum") {
      this.deployer = EthereumContractKit.getInstance("./deployed_contract");
    }
  }
  addConfig(deployment_configuration_data) {
    this.deployment_configuration_data = deployment_configuration_data;
  }
  static getInstance(network) {
    if (!FSMStateReplayer.instance|| network!=FSMStateReplayer.instance.network) {
      let oldConfig = null;
      if(FSMStateReplayer.instance)
          oldConfig = FSMStateReplayer.instance.deployment_configuration_data;
      FSMStateReplayer.instance = new FSMStateReplayer(network);
      if(oldConfig)
        FSMStateReplayer.instance.deployment_configuration_data = oldConfig;
    }
    return FSMStateReplayer.instance;
  }

  // make state=initial, by re-deploying smart contracts to Ethereum or FiscoBcos
  async initialize() {
    let contract_instance = null;
    while(!contract_instance || !contract_instance.address){
      try {
        contract_instance = await this.deployer.deploy_contract_precompiled_params(FSMStateReplayer.getInstance().deployment_configuration_data.contract,
          FSMStateReplayer.getInstance().deployment_configuration_data.func,
          FSMStateReplayer.getInstance().deployment_configuration_data.params);
      } catch (error) {
        console.error(error);
        continue;
      }
    }
    console.log("initialize:", contract_instance);
    return contract_instance.address;
  }
}

const MEMBERQUERY_LIMIT = 50;
class MembershipQueryEngine{
  constructor(seed, contract_name, network) {
      //  super(seed, contract_name);
      this.network = network;
      if (!this.network || this.network == "fisco-bcos") {
        this.fuzzer = FiscoFuzzer.getInstance(seed, contract_name)
      }else{
        this.fuzzer = EthereumFuzzer.getInstance(seed, contract_name);
      }
      this.replayer = FSMStateReplayer.getInstance(network);
      // current address of smart contract instance .
      this.addressMap  = new Map();
      // Transaction Cache Trie
      this.trie = new TransactionCacheTrie(null);
  }
  static getOrCreateInstance(seed, contract_name, network) {
    if (!MembershipQueryEngine.instance) {
      MembershipQueryEngine.instance = new MembershipQueryEngine(seed, contract_name, network)
    }
    return MembershipQueryEngine.instance;
  }
  async reset(uniqueId){
    let address  =  await this.replayer.initialize();
    this.addressMap.set(uniqueId,address);
  }
  async fuzz(uniqueId, method){
    assert(this.addressMap.has(uniqueId));
      let ret = new Object();
      let count = 0;
      while ((
            (!ret || !ret.receipt || !ret.receipt.status) // result is null
            || 
            (ret.receipt.status!="0x0") // result is not null but the status is not "0x0" ("0x0" means no error)
            )
          && count<MEMBERQUERY_LIMIT  // maximum number to try to make staus at "0x0"
          ){
        ret = await this.fuzzer.full_fuzz_fun(this.replayer.deployment_configuration_data.contract, this.addressMap.get(uniqueId), method);
        
        count++;
      }
      return ret.receipt&& ret.receipt.status=="0x0";
    }
   // tranlate predicate
   /* eg. "a>0,b=0"  into 
      {
        predicates:[
            { index:0, predicate:{greater:true, pivot:0} }, 
            { index:1,  predicate:{equal:true, pivot:0} }]
      }
    */
   tranlateToPredicates(predicatesStr){
      console.log(predicatesStr);
      let predicates = [];
      for(let predicateStr of predicatesStr.split(",")){
        if(predicateStr.indexOf(">")!=-1){
          // greater predicate
          let lrs = predicateStr.split(">");
          let index = lrs[0].charCodeAt(0)-"a".charCodeAt(0);
          let pivot = parseInt(lrs[1]);
          predicates.push({index:index, predicate:{greater:true, pivot:pivot}});
        }else if(predicateStr.indexOf("<")!=-1){
          // greater predicate
          let lrs = predicateStr.split("<");
          let index = lrs[0].charCodeAt(0)-"a".charCodeAt(0);
          let pivot = parseInt(lrs[1]);
          predicates.push({index:index, predicate:{less:true, pivot:pivot}});
        }else if(predicateStr.indexOf("=")!=-1){
          // greater predicate
          let lrs = predicateStr.split("=");
          let index = lrs[0].charCodeAt(0)-"a".charCodeAt(0);
          let pivot = parseInt(lrs[1]);
          predicates.push({index:index, predicate:{equal:true, pivot:pivot}});
        }
      }
      return {predicates:predicates};
   }
   
   async answerQuery(uniqueId, query){  
      console.log("Incoming Query: "+query);
      let methods = query.split("-->");
      let i = methods.length;
      for (; i>0; i--){
            let node = this.trie.contains(methods.slice(0,i)).node;
            if(node){
              let transactions = node.getTransactions().slice(1);
              let address = await this.replayer.initialize();
              let ret = null;
              for (let transaction of transactions){
                console.log("replay transaction");
                transaction.raw_tx.to = address;
                ret = await this.fuzzer.full_fuzz_fun(this.replayer.deployment_configuration_data.contract, address, transaction.method.split(" ")[0],{raw_tx: transaction.raw_tx});        
                if(ret.receipt.status!="0x0"){
                  console.log("try more time");
                  ret = await this.fuzzer.full_fuzz_fun(this.replayer.deployment_configuration_data.contract, address, transaction.method.split(" ")[0],{raw_tx: transaction.raw_tx});        
                }
              }
              for(let method of methods.slice(i)){
                let count = 0;
                
                // Predicate handling
                if(method.split(" ").length>1){
                  ret = await this.fuzzer.full_fuzz_fun(this.replayer.deployment_configuration_data.contract, address, method.split(" ")[0], this.tranlateToPredicates(method.split(" ")[1]));  
                }else{
                  ret = await this.fuzzer.full_fuzz_fun(this.replayer.deployment_configuration_data.contract, address, method);  
                }

                while (ret.receipt.status!="0x0" // result is null // result is not null but the status is not "0x0" ("0x0" means no error)
                    && ++count < MEMBERQUERY_LIMIT ) // maximum number to try to make staus at "0x0"
                {
                    // Predicate handling
                    if(method.split(" ").length>1){
                      ret = await this.fuzzer.full_fuzz_fun(this.replayer.deployment_configuration_data.contract, address, method.split(" ")[0], this.tranlateToPredicates(method.split(" ")[1]));  
                    }else{
                      ret = await this.fuzzer.full_fuzz_fun(this.replayer.deployment_configuration_data.contract, address, method);  
                    }
                }   
                
                if(ret.receipt.status=="0x0"){
                    node = node.addTransaction({method:method, raw_tx:ret.raw_tx});
                }else{
                    console.log("NO: (semi-) old query: "+query);
                    return false;
                }
                
              }
              if(ret && ret.receipt && ret.receipt.status && ret.receipt.status=="0x0"){
                console.log("YES: (semi-) old query: "+query);
              }else{
                console.log("NO: (semi-) old query: "+query);
              }
              return ret && ret.receipt && ret.receipt.status && ret.receipt.status=="0x0";
           }
      }
      assert(i==0);
      if (i==0){
            // default: this is a totally new query
            let address = await this.replayer.initialize();
            let node = this.trie.root;
            let ret = null;
            for(let method of methods){

              let count = 0;

              // Predicate handling
              if(method.split(" ").length>1){
                ret = await this.fuzzer.full_fuzz_fun(this.replayer.deployment_configuration_data.contract, address, method.split(" ")[0], this.tranlateToPredicates(method.split(" ")[1]));  
              }else{
                ret = await this.fuzzer.full_fuzz_fun(this.replayer.deployment_configuration_data.contract, address, method);  
              }

             
              while (ret.receipt.status!="0x0" // result is null // result is not null but the status is not "0x0" ("0x0" means no error)
                        && ++count < MEMBERQUERY_LIMIT ) // maximum number to try to make staus at "0x0"
              {
                     // Predicate handling
                    if(method.split(" ").length>1){
                      ret = await this.fuzzer.full_fuzz_fun(this.replayer.deployment_configuration_data.contract, address, method.split(" ")[0], this.tranlateToPredicates(method.split(" ")[1]));  
                    }else{
                      ret = await this.fuzzer.full_fuzz_fun(this.replayer.deployment_configuration_data.contract, address, method);  
                    }
              }   
              
              if(ret.receipt.status=="0x0"){
                  node = node.addTransaction({method:method, raw_tx:ret.raw_tx});
              }else{
                  console.log("NO: new query: "+query);
                  return false;
              }

            }
            if(ret && ret.receipt && ret.receipt.status && ret.receipt.status=="0x0"){
              console.log("YES: new query: "+query);
            }else{
              console.log("NO: new query: "+query);
            }
            return ret && ret.receipt && ret.receipt.status && ret.receipt.status=="0x0";
        }
    }
}


class FiscoStateMachineTestEngine {
  constructor(seed, contract_name, network) {
    //  super(seed, contract_name);
    this.network = network;
    if (!this.network || this.network == "fisco-bcos") {
      this.fuzzer = FiscoFuzzer.getInstance(seed, contract_name)
    }
    if (this.network == "ethereum") {
      this.fuzzer = EthereumFuzzer.getInstance(seed, contract_name);
    }
    this.replayer = FSMStateReplayer.getInstance(network);
   
   
  }
  
  _getRandomInt(max) {
    return Math.floor((1 - Math.random()) * Math.floor(max));
  }
  async randomTest(createStateMachine, StateMachineCtx, revertAsyncFlag, covering_strategy, test_priority, socket) {
    let stateMachine = createStateMachine(
      StateMachineCtx.getInstance(
        // this.replayer,
        // this.fuzzer
        null,
        null
      ));
    let service = interpret(stateMachine).onTransition(state => {
      console.log(state.value);
    });
    let plans = FSMStrategyManager.getInstance(socket, covering_strategy).execute_strategy(stateMachine);
    FSMTestCaseProrityManager.getInstance(test_priority).rearrange(plans);
    StateMachineCtx.getInstance().fsmreplayer = this.replayer;
    StateMachineCtx.getInstance().fuzzer = this.fuzzer;

    let actions_pool = new Set();
    let unique_functions = new Set();
    for (let plan of plans) {
      for (let path of plan.paths) {
        service.start();
        let events = path.description.split("via ")[1].split(" → ");
        let state = service.send(events);
        // actions_pool = actions_pool.concat(state.actions)
        for (let action of state.actions) {
        
          if (!unique_functions.has(action.type)){
              actions_pool.add(action);
              unique_functions.add(action.type);
          }
        }
        service.stop();
      }
    }
    revertAsyncFlag();
    console.log(actions_pool);
    actions_pool = Array.from(actions_pool);
    console.log("the size of action pool is:", actions_pool.length);


    let startTime = Date.now() / 1000;
    let count = 0;
    let isStop = false;
    socket.on("client-stop", function (data) {
      console.log(data);
      isStop = true;
    });
    const DEPTH = 6;

    let current_total_test_cases = 0;
   
    while (!isStop) {
      await StateMachineCtx.getInstance().initialize();
      let action_index = 0;
      let all_test_cases =[];
      for (let i = 0; i < DEPTH; i++) {
        try {
          let action = actions_pool[this._getRandomInt(actions_pool.length)];
          let ret = await action.exec();
          current_total_test_cases += ret.length;
          all_test_cases = all_test_cases.concat(ret);
          let state = await StateMachineCtx.getInstance().getState();
          socket.emit("server", {
            event: "RandomTestAction_Report",
            data: {
              startTime: startTime,
              currentTime: Date.now() / 1000,
              test_cases: current_total_test_cases,
              action: action.type,
              index: ++action_index,
              state: state.toString()
            }
          });
          count = 0;
          
        } catch (err) {
          console.error(err);
          current_total_test_cases += MAX_COUNT;
        }finally{
          if (isStop) {
            fs.writeFileSync("./logs/transactions.log"+(new Date()).toString(),JSON.stringify(all_test_cases),{encoding:"utf8",flag:"a"});
            socket.emit("server-stop", ` Server stopped at the time at ${(new Date()).toString()}.`)
            return "stopped";
          }
        }
      }
      fs.writeFileSync("./logs/transactions.log"+(new Date()).toString(),JSON.stringify(all_test_cases),{encoding:"utf8",flag:"a"});
    }
    socket.emit("server-stop", ` Server stopped at the time at ${(new Date()).toString()}.`);
    return "success";
  }
  async bootstrap(createStateMachine, StateMachineCtx, revertAsyncFlag, covering_strategy, test_priority, socket) {
    let stateMachine = createStateMachine(
      StateMachineCtx.getInstance(
        // this.replayer,
        // this.fuzzer
        null,
        null
      ));
    let service = interpret(stateMachine).onTransition(state => {
      console.log(state.value);
    });
    let plans = FSMStrategyManager.getInstance(socket, covering_strategy).execute_strategy(stateMachine);
    FSMTestCaseProrityManager.getInstance(test_priority).rearrange(plans);
    StateMachineCtx.getInstance().fsmreplayer = this.replayer;
    StateMachineCtx.getInstance().fuzzer = this.fuzzer;
    service = aa.promisifyAll(service);
    let index = 0;
    for (let plan of plans) {
      console.log("plan#", index++);
      for (let path of plan.paths) {
        console.log(path.description);
      }
    }
    console.log("******************************");


    let isStop = false;
    socket.on("client-stop", function (data) {
      console.log(data);
      isStop = true;
    });

    let current_total_test_cases = 0;
    let startTime = Date.now() / 1000;

    index = 0;
    while (!isStop) {
      let len = plans.length;
      while (index < len) {
        let hasFailure = false;
        let plan = plans[index];
        console.log("plan#", index++);
        /**
         * for coverage improvement,
         * we care more about failed paths
         * insert these path at the beginning of plan paths.
         */
        for (let path of plan.paths) {
          await StateMachineCtx.getInstance().initialize();
          service.start();
          let events = path.description.split("via ")[1].split(" → ");
          console.log(path.description);
          // console.log("transition by event ", events);
          let state = service.send(events);
          // console.log(state.actions);
          revertAsyncFlag();
          let action_index = 0;
          let count = 0; // count how many errors when handling 
          try {
            for (let action of state.actions) {
              action_index++;
              let ret = await action.exec();
              current_total_test_cases += ret.length;
              socket.emit("server", {
                event: "Action_Report",
                data: {
                  startTime: startTime,
                  currentTime: Date.now() / 1000,
                  test_cases: current_total_test_cases,
                  plan: state.actions,
                  action: action.type,
                  index: action_index
                }
              });
              count = 0;
              if (isStop) {
                socket.emit("server-stop", ` Server stopped at the time at ${(new Date()).toString()}.`)
                return "stopped";
              }
            }
          } catch (err) {
            if (err.toString().indexOf("TIMEOUT") != -1 || err.toString().indexOf("postCondition violated:") != -1) {
              current_total_test_cases += MAX_COUNT;
              console.log("unhandled timeout counter: ", count);
            }
            console.log(err);
            hasFailure = true;
          }
          if (isStop) {
            socket.emit("server-stop", ` Server stopped at the time at ${(new Date()).toString()}.`)
            return "stopped";
        }
          revertAsyncFlag();
          service.stop();
        }
        
        console.log("Approaching fsm state->", plan.state.value);
        console.log("********************************************");
        if (hasFailure) { // add more chance to the failed plan
          plans.push(plan);
        }
        len = plans.length;
        if (index == len) { //restart the testing process
          index = 0;
        }
      }
    }
    socket.emit("server", {
      event: "event_Test_Done"
    });
    socket.emit("server-stop", ` Server stopped at the time at ${(new Date()).toString()}.`)
    return "success";
  }

}
class FSMTestUtil {
  constructor(socket) {
    this.socket = socket;
  }
  upload_fsmjson(fsm) {
    //State Machine cat
    assert(fsm.states);
    assert(fsm.transitions);
    // Customized actions
    assert(fsm.actions);
    //  Related contracts
    assert(fsm.contracts);
  }
}
class EventHandler {
  constructor(socket) {
    this.socket = socket;
  }
  Upload_client(data) {
    // console.log(data);
  }
  Compile_client(data) {
    console.log(data);
    let ret = compiler.compile("./uploads", data);
    this.socket.emit(event_Compile, ret);
  }
  Deploy_client(data) {
    console.log(data);
    var socket = this.socket;
    let deployer;
    if (!data.network|| data.network == "fisco-bcos") {
          deployer = FiscoContractKit.getInstance("./deployed_contract");
    }else  if (data.network == "ethereum") {
          deployer = EthereumContractKit.getInstance("./deployed_contract");
    }
    assert(deployer, ` unsupported network ${data.network}`);
    deployer.initialize().then(deployer =>{
         deployer.deploy_contract_precompiled_params(data.contract, data.func, data.params).then(function (ret_data) {
                FSMStateReplayer.getInstance(data.network).addConfig(data);
                console.log(event_Deploy, ret_data);
                socket.emit(event_Deploy, ret_data);
          }).catch(function (err) {
            console.log(err);
            console.log("deploy error: for data ", data)
          });
       });
  }
  Call_client(data) {
    console.log(data);
  }
  Transaction_client(data) {
    console.log(data);
    var socket = this.socket;
    deployer.transcation_send(data.contract, data.address, data.func, data.params).then(function (data) {
      socket.emit(event_Transaction, data);
    }).catch(function (err) {
      console.log(err);
      console.log("transaction error: for data ", data)
    });
  }
  Test_client(data) {
    console.log(data)
    let random_test = data.random_test;
    let covering_strategy = data.covering_strategy;
    let test_priority = data.test_priority;
    let file_name = data.file_name;
    let target_contract = data.target_contract;
    let model_script = data.model_script;
    let network = data.network;
    shell.mkdir("-p", `./model_testing`);
    let date = new Date();
    fs.writeFileSync(`./model_testing/${file_name+"."+date.toISOString()}`, model_script, "utf-8");
    try {
      if (!random_test) {
        let StateMachineCtx = require(`./model_testing/${file_name+"."+date.toISOString()}`).StateMachineCtx;
        let createStateMachine = require(`./model_testing/${file_name+"."+date.toISOString()}`).createStateMachine;
        let revertAsyncFlag = require(`./model_testing/${file_name+"."+date.toISOString()}`).revertAsyncFlag;
        let engine = new FiscoStateMachineTestEngine(1, target_contract, network);
        // engine.load();
        engine.bootstrap(createStateMachine, StateMachineCtx, revertAsyncFlag, covering_strategy, test_priority, this.socket).then(data => {
          console.log(data);
        }).catch(err => {
          console.error("bootstrap error: ");
          console.error(err);
        });
      } else {
        let StateMachineCtx = require(`./model_testing/${file_name+"."+date.toISOString()}`).StateMachineCtx;
        let createStateMachine = require(`./model_testing/${file_name+"."+date.toISOString()}`).createStateMachine;
        let revertAsyncFlag = require(`./model_testing/${file_name+"."+date.toISOString()}`).revertAsyncFlag;
        let engine = new FiscoStateMachineTestEngine(1, target_contract, network);
        // engine.load();
        engine.randomTest(createStateMachine, StateMachineCtx, revertAsyncFlag, covering_strategy, test_priority, this.socket).then(data => {
          console.log(data);
        }).catch(err => {
          console.log("random test  error: ");
          console.log(err);
        })
      }
    } catch (err) {
      console.error(err);
    };
  }
  Learn_client(data){
    let target_contract = data.target_contract;
    let network = data.network;
    let mqQueryEngine = MembershipQueryEngine.getOrCreateInstance(1, target_contract, network);
    console.log(mqQueryEngine);
    membershipQueryServer.setMembershipQueryEngine(mqQueryEngine);
    membershipQueryServer.bootstrap();
  }
}



io.on('connection', socket => {
  console.log(`A user connected with socket id ${socket.id}`)
  socket.on('pingServer', data => {
    console.log(`pingServer A user connected with socket id`, socket.id, data);
    socket.emit('customEmit', "hello world");
  })
  let handler = new EventHandler(socket);
  socket.on("client", function (event) {
    assert(handler[event.type], "invalid event type");
    console.log("event:", event.type);
    handler[event.type](event.data);
  });

  // Make an instance of SocketIOFileUpload and listen on this socket:
  var uploader = new SocketIOFileUpload();
  shell.mkdir("-p", "./uploads");
  uploader.dir = "./uploads";
  uploader.listen(socket);

  // Do something when a file is saved:
  uploader.on("saved", function (event) {
    // console.log(event.file);
    console.log("saved");
  });

  // Error handler:
  uploader.on("error", function (event) {
    console.log("Error from uploader", event);
  });

  //  Do remove old file when same name file exists
  uploader.on("start", function (event) {
    console.log(path.join(uploader.dir, event.file.name));
    if (fs.existsSync(path.join(uploader.dir, event.file.name))) {
      console.log("overwrite existing file:", path.join(uploader.dir, event.file.name));
      shell.rm("-f", path.join(uploader.dir, event.file.name));
    }
  });
})
http.listen(3000, () => {
  console.log('Listening on *:3000')
})
