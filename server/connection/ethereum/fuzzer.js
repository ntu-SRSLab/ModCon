const fs = require("fs");
const path = require("path");
const assert = require("assert");
const Web3 = require("web3-vultron");
const truffle_Contract = require("truffle-contract");

const readJSON = require("./common.js").readJSON;
const write2file = require("./common.js").write2file;
const types = require("./common.js").types;

const gen_callFun = require("./common_randompool.js").gen_callFun;
const importAccounts = require("./common_randompool").importAccounts;

const abiDecoder = require('abi-decoder');


const contract_mapping = {};
class EthereumContractKit {
    constructor(workdir, account, password, httprpc, max_gas, max_value) {
         this.workdir = workdir;
         this.account = account;
         this.password = password;
         this.httprpc = httprpc;
         this.max_gas  = max_gas;
         this.max_value = max_value;
        //  this.initialize();
    }
    static getInstance(workdir) {
        if (!EthereumContractKit.instance) {
            EthereumContractKit.instance = new EthereumContractKit(workdir,  null, null, "http://localhost:8645", 10000000000, 100);
        }
        return EthereumContractKit.instance;
    }
    async initialize(){
        if(!this.initialized){
        this.Provider = new Web3.providers.HttpProvider(this.httprpc);
        this.web3 =  new Web3(this.Provider); 
        console.log(`connect to ethereum?  ${this.web3.isConnected()? "yes":"no"}`);
        console.log(   `ethereum accounts: ${this.web3.eth.accounts}`);
        let account = this.web3.eth.accounts[0];
        for(let acc of this.web3.eth.accounts){
                if(this.web3.eth.getBalance(acc) > this.web3.eth.getBalance(account) )
                    account = acc;
        }
        console.log("user account: ", account);
        this.defaultAmountParamsWithValue = {
            from: account,
            value: this.max_value,
            gas: this.max_gas
        };
        this.defaultAmountParams = {
            from: account,
            gas: this.max_gas
        };
        importAccounts(this.web3.eth.accounts);
        this.initialized = true;
    }
        return this;
    }
    _get_truffle_contract(config){
        let Contract;
        if(config.address)
                Contract = truffle_Contract({
                    contract_name: config.conract_anme,
                    abi: config.abi,
                    unlinked_binary: config.bytecode,
                    network_id: 1900,
                    default_network: 1900
                 });
        else
                 Contract = truffle_Contract(
                     {
                        contract_name: config.conract_anme,
                        abi: config.abi,
                        unlinked_binary: config.bytecode,
                        address: config.address,
                        network_id: 1900,
                        default_network: 1900
                     }
                 )
        Contract.setProvider(this.Provider);
        return Contract;
    }
    async deploy_contract(contract_name){
        assert(fs.existsSync(path.join(this.workdir, contract_name, contract_name + ".sol")), "contract not exist");
        let abi = readJSON(path.join(this.workdir, contract_name, contract_name + ".abi"));
        let bytecode = fs.readFileSync(path.join(this.workdir, contract_name, contract_name + ".bin"),"utf8");
        let Contract = this._get_truffle_contract({
            contract_name: contract_name,
            abi: abi,
            bytecode: bytecode
        });
        // console.log(this.defaultAmountParams);
        this.defaultAmountParams.gas = this.web3.eth.getBlock("latest").gasLimit-3;
        console.log(this.defaultAmountParams.gas);
        let instance = await Contract.new(this.defaultAmountParams);
        contract_mapping[contract_name] =  instance;
        contract_mapping[instance.address] = instance;
        write2file(path.join(this.workdir, contract_name, instance.address), JSON.stringify(instance));
        return instance;
    } 
    async deploy_contract_precompiled(contract_name) {
        assert(fs.existsSync(path.join(this.workdir, contract_name, contract_name + ".sol")), "contract not exist");
        let abi = readJSON(path.join(this.workdir, contract_name, contract_name + ".abi"));
        let bytecode = fs.readFileSync(path.join(this.workdir, contract_name, contract_name + ".bin"),"utf8");
        let Contract = this._get_truffle_contract({
            contract_name: contract_name,
            abi: abi,
            bytecode: bytecode
        });
        this.defaultAmountParams.gas = 5*this.web3.eth.getBlock("latest").gasLimit/6;
        console.log(this.defaultAmountParams.gas);
        let instance = await Contract.new(this.defaultAmountParams);
        contract_mapping[contract_name] =  instance;
        contract_mapping[instance.address] = instance;
        write2file(path.join(this.workdir, contract_name, instance.address), JSON.stringify(instance));
        return instance;
    }
    async deploy_contract_precompiled_params(contract_name, full_func, params) {
        assert(fs.existsSync(path.join(this.workdir, contract_name, contract_name + ".sol")), "contract not exist");
        console.log(contract_name, full_func, params);
        let abi = readJSON(path.join(this.workdir, contract_name, contract_name + ".abi"));
        let bytecode = fs.readFileSync(path.join(this.workdir, contract_name, contract_name + ".bin"),"utf8");
        let Contract = this._get_truffle_contract({
            contract_name: contract_name,
            abi: abi,
            bytecode: bytecode
        });
        this.defaultAmountParams.gas = 5*this.web3.eth.getBlock("latest").gasLimit/6;
        console.log(this.defaultAmountParams.gas);
        let instance;
        if(params && params.length){
                instance = await Contract.new(...params, this.defaultAmountParams);
        }else{
                 instance = await Contract.new(this.defaultAmountParams);
        }
        contract_mapping[contract_name] =  instance;
        contract_mapping[instance.address] = instance;
        write2file(path.join(this.workdir, contract_name, instance.address), JSON.stringify(instance));
        instance.name = contract_name;
        return instance;
    }
    async transcation_send(contract_name, address, full_func, params){
        assert (contract_name in contract_mapping, `${contract_name} has  not been deployed.`);
        let instance;
        if(contract_name)
                instance = contract_mapping[contract_name];
        else if (address){
                 instance = contract_mapping[address];
        }
        let fun_name = full_func.split("(")[0];
        console.log(contract_name, address, full_func,  params);
        let receipt;
        this.defaultAmountParams.gas = 5*this.web3.eth.getBlock("latest").gasLimit/6;
        console.log(this.defaultAmountParams.gas);
        let attempt_count =  0;
        while(!receipt&&attempt_count<10){
                    if(params && params.length){
                        receipt = await  instance[fun_name](...params, this.defaultAmountParams);
                        // assert(receipt, "receipt is null");
                    }
                    else{
                        receipt = await  instance[fun_name]( this.defaultAmountParams);
                        // assert(receipt, "receipt is null");
                    }
        }
        assert(receipt, "receipt is null, and the reason is unknown");
        console.log("receipt: ", receipt);
        if(receipt && receipt.receipt)
            receipt.status = ((this.defaultAmountParams.gas == receipt.receipt.gasUsed) && (receipt.receipt.gasUsed !=2300)) ?"-0x1":"0x0";
        return receipt;
    }
    async getInstance(contract_name, address) {
        assert(fs.existsSync(path.join(this.workdir, contract_name, contract_name + ".sol")), "contract not exist");
        if(contract_name in contract_mapping)
            return contract_mapping[contract_name];
        if(address in contract_mapping)
            return contract_mapping[address];
        
        let abi = readJSON(path.join(this.workdir, contract_name, contract_name + ".abi"));
        let bytecode = fs.readFileSync(path.join(this.workdir, contract_name, contract_name + ".bin"),"utf8");
        let Contract = this._get_truffle_contract({
            contract_name: contract_name,
            abi: abi,
            bytecode: bytecode,
            address: address
        });
        let instance = await Contract.at(address);
        contract_mapping[contract_name] = instance;
        contract_mapping[instance.address] = instance;
        write2file(path.join(this.workdir, contract_name, instance.address), JSON.stringify(instance));
        return instance;
    }
}

class EthereumFuzzer {
    constructor(seed, contract_name){
        this.seed = seed;
        this.contract_name = contract_name;
        this.instance = "NA";
        this.loadContract = false;
        this.bootstrapContract = false;
        assert(this.seed, "seed is undefined");
        assert(this.contract_name, "contract name is undefined");
        assert(this.instance);
        this.Kit =  EthereumContractKit.getInstance("../../deployed_contract");
    }
static getInstance(seed, contract_name) {
        if (!EthereumFuzzer.instance) {
            EthereumFuzzer.instance = new EthereumFuzzer(seed, contract_name);
        }
        return EthereumFuzzer.instance;
    }
    async load() {
        this.instance = this.Kit.getInstance(this.contract_name);     
        this.loadContract = true;
        let ret = {
            accounts: this.Kit.web3.eth.accounts,
            target_adds: this.instance.address,
            target_abi: this.instance.abi
        };
        this.loadContract = true;
        // import ethereum accounts into common_randompool 
        //                for test case random generation
          return ret;
    }

    async bootstrap() {
        assert(this.loadContract == true, "function load(...) must be called before");
         this.bootstrapContract = true;
        return {
            callFuns: [],
            execResults: []
        };
    }

  async full_fuzz_fun(contract_name, address, fun_name, option){
        if(fun_name.indexOf("("))
            fun_name = fun_name.split("(")[0];
        let instance = await this.Kit.getInstance(contract_name, address);
        let raw_tx = await this._fuzz_fun(instance.address, instance.abi, fun_name, option);
        let abi = instance.abi.filter(e => {
            return e.name == fun_name.split("(")[0]
        });
        console.log(fun_name, abi);
        if (abi[0].constant || abi[0].stateMutability=="view") {
            let receipt = await this.Kit.transcation_send(contract_name, instance.address, raw_tx.fun, raw_tx.param);
            return {receipt: receipt, logs: null, raw_tx:raw_tx};
        } else {
            let receipt = await this.Kit.transcation_send(contract_name, instance.address, raw_tx.fun, raw_tx.param);
            abiDecoder.addABI(instance.abi);
            let log = await  abiDecoder.decodeLogs(receipt.logs)
            return {receipt: receipt,  logs: log, raw_tx:raw_tx};
        }
    }
    async _fuzz_fun(address, abis, fun_name, option) {
        // abi:[matched...]
        let abi = abis.filter(e => {
            return e.name == fun_name
        });
        assert(abi && abi.length == 1, "matched abi array is empty");
        console.log(abi, fun_name);
        let ret = await gen_callFun(abi[0], address, option);
        //console.log(ret);
        return {
            from: ret.from,
            to: ret.to,
            fun: ret.abi.name + "(" + types(ret.abi.inputs) + ")",
            param: ret.param
        }
    }
}


exports.EthereumContractKit = EthereumContractKit;
exports.EthereumFuzzer  = EthereumFuzzer;

// for test only
// let MyEthereum = EthereumContractKit.getInstance("../../deployed_contract");
// MyEthereum.initialize();
// let MyEthereum = new EthereumContractKit("../../deployed_contract", null, null, "http://localhost:8645", 10000000000, 100);
// MyEthereum.initialize();
// MyEthereum.deploy_contract("BlindAuction").then(instance =>{
//     console.log("BlindAuction: ", instance.address);
//     MyEthereum.transcation_send("BlindAuction", instance.address, "bid(uint256,byte32)",["0x0", "0x2"])
//     .then( receipt =>{
//         console.log(receipt);
//         MyEthereum.transcation_send("BlindAuction", instance.address, "bid(uint256,byte32)",["0x0", "0x2"])
//         .then( receipt =>{
//             console.log(receipt);
//         }).catch( err => {
//             console.error(err);
//         });
//     }).catch( err => {
//         console.error(err);
//     });
// }).catch(err =>{
//     console.error(err);
// });

// MyEthereum.deploy_contract("AccountController").then(instance =>{
//     console.log("AccountController: ", instance.address);
//     MyEthereum.transcation_send("AccountController",instance.address, "getAccountMap()").then( receipt =>{
//         console.log("AccountMap:", receipt);
//         MyEthereum.getInstance("AccountMap", receipt).then(MyAccountMap =>{
//             // console.log(MyAccountMap);
//             MyEthereum.transcation_send("AccountController", instance.address, "registeAccount(bytes32,bytes32,bytes32,string)",  ["0x12", "0x2", "0x1", "0x43424efe34"]).then( receipt =>{
//                 console.log("registerAccount:", receipt);
//                 MyEthereum.transcation_send("AccountController", instance.address, "getAccountByAccountNo(bytes32)", ["0x2"]).then( receipt =>{
//                     console.log("getAccount: ", receipt);
//                 }).catch(err =>{
//                     console.error(err);
//                 });
//                 MyEthereum.transcation_send("AccountMap", MyAccountMap.address, "accountExists(bytes32)", ["0x2"]).then( receipt =>{
//                     console.log("accountExists(0x02): ", receipt);
//                 }).catch(err=>{
//                     console.error(err);
//                 });
//           }).catch(err => {
//                  console.error(err);
//           });
//         });
        
//     }).catch(err => {
//         console.error(err);
//     });
// });