const assert = require("assert");
/// the gas amount
const gasMax = 8000000000;

const UserAccount = "0xdf847c88bf4447225a482e7cdcedb3608ec5ea0b";

const cryptoRandomString = require('crypto-random-string');
const { round } = require("lodash");
const randomInt = require('random-int');

let g_targetContract = undefined;
class Pool {
    constructor(range, size, description) {
        assert(range, "range is undefined or zero");
        assert(size, "size is undefined or zero");
        this.description = description;
        this.range = range;
        this.size = size;
        this.pool = undefined;
    }
    _random() {
        console.log("Pool _random()");
        return 0;
    }
    _constant() {
        console.log("Pool _constant");
        return [];
    }
    random() {
        if (this.pool == undefined) {
            this.pool = [];
            this.pool = this.pool.concat(this._constant());
            let constLen = this.pool.length;
           for (let i = 0; i < (this.size-constLen); i++)
                this.pool.push(this._random());
        }
        return this.pool[Math.floor(Math.random() * this.pool.length)];
    }
}
class IntPool extends Pool {
    constructor(sign, range, size, description) {
        super(range, size, description);
        this.sign = sign;
    }
    _constant() {
        if (false == this.sign)
            return [0, 1, 2,3,4,5,6,7,8, 9];
        else
            return [-1, 0, 1,2,3,4,5,6,7,8];
    }
    _random() {
        return Math.floor(Math.random() * (this.range.end - this.range.start)) + this.range.start;
    }
}
class BigIntPool extends Pool {
    constructor(sign, range, size, description) {
        super(range, size, description);
        this.sign = sign;
    }
    _constant() {
        if (false == this.sign)
            return ["0x0", "0x1", "0x2", "0x3", "0x4", "0x5", "0x6", "0x7"];
        else
            return ["-0x1", "0x0", "0x1", "0x2", "0x3", "0x4", "0x5", "0x6"];
    }
    _random() {
        return "0x" + cryptoRandomString({
            length: Math.floor((Math.random() * (this.range.end - this.range.start) + this.range.start) * 2)
        });
    }
}
class BytePool extends Pool {
    //range.start -> range.end
    // eg.  byte4.  range.start =1, range.end = 4
    // eg.   bytes.  range.start = 1,  range.end = 10;
    constructor(range, size, description) {
        super(range, size, description);
    }
    _constant() {
        return ["0x0", "0x1", "0x2","0x3", "0x4", "0x5"];
    }
    _random() {
        return "0x" + cryptoRandomString({
            length: Math.floor((Math.random() * (this.range.end - this.range.start) + this.range.start) * 2)
        });
    }
}

class BoolPool extends Pool {
    //range.start -> range.end
    // eg.  byte4.  range.start =1, range.end = 4
    // eg.   bytes.  range.start = 1,  range.end = 10;
    constructor(range, size, description) {
        super(range, size, description);
    }
    _constant() {
        return [false, false, false, false, false, false, true,  true,  true];
    }
    _random() {
        return  true;
    }
}

class AddressPool extends Pool {
    //range.start -> range.end
    // eg.  byte4.  range.start =1, range.end = 4
    // eg.   bytes.  range.start = 1,  range.end = 10;
    constructor(range, size, description) {
        super(range, size, description);
    }
    _constant() {
        return [UserAccount, "0x680e9f394ca08fea2dffe0cad74cc4c59bd1559d", "0x680e9f394ca08fea2dffe0cad74cc4c59bd1559d", "0x680e9f394ca08fea2dffe0cad74cc4c59bd1559d"];
    }
    _random() {
        return UserAccount;
    }
}
class StringPool extends Pool {
    //range.start -> range.end
    // eg.  string.  range.start =1, range.end = 4
    constructor(range, size, description) {
        super(range, size, description);
    }
    _constant() {
        return ["str0x0", "str0x1", "str0x2"];
    }
    _random() {
        return "str0x" + cryptoRandomString({
            length: Math.floor((Math.random() * (this.range.end - this.range.start) + this.range.start) * 2)
        });
    }
}

const Pools = {};
// @parameter_type :  the type of parameter in input list of ABI function
// eg.  function hello(string desc).   
//         desc  > string.
//  will work on:  
//      1. one dimentional static or dynamic array
//      2. usual type such as int , uint , address, bytes, string. 
const const_dynamic_array_size = 3;
const const_pool_size = 14;

function generate_random(parameter_type) {
    // console.log(parameter_type,  parameter_type in Pools, Pools[parameter_type]);
    // console.log(parameter_type);
    let arrayRegex = /\[([0-9]+)\]/;
    let dynamicArrayRegex = /\[\]/;
    if (parameter_type.match(dynamicArrayRegex)) {
        let match = parameter_type.match(dynamicArrayRegex);
        // console.log(match);
        let matched = match[0];
        // assert(match[1] == "", "dynamic array should be []")
        let size = const_dynamic_array_size;
        let arr = [];
        let element_type = parameter_type.replace(matched, "");
        for (let i = 0; i < size; i++)
            arr.push(generate_random(element_type));
        return arr;
    } else if (parameter_type.match(arrayRegex)) {
        let match = parameter_type.match(arrayRegex);
        // console.log(match);
        let matched = match[0];
        let size = match[1];
        let arr = [];
        let element_type = parameter_type.replace(matched, "");
        for (let i = 0; i < size; i++)
            arr.push(generate_random(element_type));
        return arr;
    } else {
        let intXXXRegex = /int([0-9]+)/;
        let uintXXXRegex = /uint([0-9]+)/;
        let bytesRegex = /bytes([0-9]+)/;
        let byteRegex = /byte$/;
        let stringRegex = /string$/;
        let addressRegex = /address$/;
        let boolRegex = /bool$/;
        if (parameter_type.match(uintXXXRegex)) {
            let match = parameter_type.match(uintXXXRegex);
            // console.log(match);
            assert(match[1], "size is empty");
            let size = Math.floor(parseInt(match[1]) / 8);
            if (false == (parameter_type in Pools)) {
                if (size < 8)
                    Pools[parameter_type] = new IntPool(false, {
                        start: 1,
                        end: size
                    }, const_pool_size, "random pools for" + parameter_type);
                else
                    Pools[parameter_type] = new BigIntPool(false, {
                        start: 1,
                        end: size
                    }, const_pool_size, "random pools for" + parameter_type);
            }
            return Pools[parameter_type].random();
        } else if (parameter_type.match(intXXXRegex)) {
            let match = parameter_type.match(intXXXRegex);
            // console.log(match);
            assert(match[1], "size is empty");
            let size = Math.floor(parseInt(match[1]) / 8);
            if (false == (parameter_type in Pools)) {
                if (size < 8)
                    Pools[parameter_type] = new IntPool(true, {
                        start: 1,
                        end: size
                    }, const_pool_size, "random pools for" + parameter_type);
                else
                    Pools[parameter_type] = new BigIntPool(true, {
                        start: 1,
                        end: size
                    }, const_pool_size, "random pools for" + parameter_type);
            }
            return Pools[parameter_type].random();
        } else if (parameter_type.match(bytesRegex)) {
            let match = parameter_type.match(bytesRegex);
            // console.log(match);
            assert(match[1], "size is empty");
            let size = Math.floor(parseInt(match[1]) / 8);
            if (false == (parameter_type in Pools)) {
                Pools[parameter_type] = new BytePool({
                    start: 1,
                    end: size
                }, const_pool_size, "random pools for" + parameter_type);
            }
            return Pools[parameter_type].random();
        } else if (parameter_type.match(byteRegex)) {
            let match = parameter_type.match(byteRegex);
            // console.log(match);
            if (false == (parameter_type in Pools)) {
                Pools[parameter_type] = new BytePool({
                    start: 1,
                    end: 1
                }, const_pool_size, "random pools for" + parameter_type);
            }
            return Pools[parameter_type].random();
        } else if (parameter_type.match(stringRegex)) {
            let match = parameter_type.match(stringRegex);
            // console.log(match);
            if (false == (parameter_type in Pools)) {
                Pools[parameter_type] = new StringPool({
                    start: 1,
                    end: const_dynamic_array_size
                }, const_pool_size, "random pools for" + parameter_type);
            }
            return Pools[parameter_type].random();
        } else if (parameter_type.match(addressRegex)) {
            let match = parameter_type.match(addressRegex);
            // console.log(match);
            if (false == (parameter_type in Pools)) {
                Pools[parameter_type] = new AddressPool({
                    start: 1,
                    end: const_dynamic_array_size
                }, const_pool_size, "random pools for" + parameter_type);
            }
            return Pools[parameter_type].random();
        } else if (parameter_type.match(boolRegex)) {
            let match = parameter_type.match(boolRegex);
            // console.log(match);
            if (false == (parameter_type in Pools)) {
                Pools[parameter_type] = new BoolPool({
                    start: 1,
                    end: 1
                }, const_pool_size, "random pools for" + parameter_type);
            }
            return Pools[parameter_type].random();
        } 
        else {
            assert(false, "unsupported type:" + parameter_type);
            return "0x0";
        }
    }
}


function randomNum(min, max) {
    if (min >= max) {
        return Math.floor(min);
    } else {
        let range = max - min;
        let rand = Math.random();
        let num = min + Math.floor(rand * range);
        return num;
    }
}


function randgenPredicateValue(type, predicate){
    let intXXXRegex = /int([0-9]+)/;
    let uintXXXRegex = /uint([0-9]+)/;
    if (type.match(uintXXXRegex)) {
            let match = type.match(uintXXXRegex);
            let size = Math.floor(parseInt(match[1]) / 8);
            if(predicate.greater){
                assert(predicate.pivot!=null);
                let rand = "0x"+ cryptoRandomString({length:randomInt(1,size)*2});
                while(BigInt(predicate.pivot)>=BigInt(rand)){
                        rand = cryptoRandomString({length:randomInt(1,size)*2})
                }
                let bound = randomInt(parseInt(predicate.pivot)+1,parseInt(predicate.pivot)+10);
                if(randomInt(100)%2 == 0){
                    return bound;
                }else{
                    return rand;
                }
                
            }else if(predicate.equal){
                assert(predicate.pivot!=null);
                let min = predicate.pivot;
                return min;
            }else if(predicate.less){
                assert(predicate.pivot!=null && parseInt(predicate.pivot)>0);
                let bound = randomInt(parseInt(predicate.pivot)-10,parseInt(predicate.pivot)-1);
                let rand = randomInt(0,parseInt(predicate.pivot)-1);
                if(randomInt(100)%2 == 0){
                    return rand;
                }else{
                    return bound;
                }
            }else if(predicate.range){// 0<x<1, 0=<x<=1
                let left = parseInt(predicate.left);
                let right = parseInt(predicate.right);
                assert(left<=right);
                if(predicate.leftop=="<"){
                    left = left+1;
                }else if (predicate.leftop=="=<"){
                    left = left;
                }
                if(predicate.rightop=="<"){
                    right = right-1;
                }else if (predicate.rightop=="<="){
                    right = right;
                }
                
                let lowerbound = randomInt(left,Math.min(left+10,right));
                let upperbound = randomInt(Math.max(right-10,left), right);
                let rand = randomInt(left, right);
                let randNum = randomInt(100);
                if(randNum%3 == 0){
                    return lowerbound;
                }else if(randNum%3==1){
                    return rand;
                }else if(randNum%3==2){
                    return upperbound;
                }
            }
    } else if (type.match(intXXXRegex)) {
        let match = type.match(intXXXRegex);
        let size = Math.floor(parseInt(match[1]) / 8);
        if(predicate.greater){
            assert(predicate.pivot!=null);
            let rand = "0x"+cryptoRandomString({length:randomInt(1,size)*2});
            while(BigInt(predicate.pivot)>=BigInt(rand)){
                    rand ="0x"+ cryptoRandomString({length:randomInt(1,size)*2-1})
            }
            let bound = randomInt(parseInt(predicate.pivot)+1,parseInt(predicate.pivot)+10);
             // if(randomInt(100)%2 == 0){
            if(randomInt(100) >= 0){
                return bound;
            }else{
                return rand;
            }
            
        }else if(predicate.equal){
            assert(predicate.pivot!=null);
            let min = parseInt(predicate.pivot);
            return min;
        }else if(predicate.less){
            assert(predicate.pivot!=null);
            let bound = randomInt(parseInt(predicate.pivot)-10,parseInt(predicate.pivot)-1);
            let rand = randomInt(parseInt(predicate.pivot)-Math.pow(10,7),parseInt(predicate.pivot)-1);
            // if(randomInt(100)%2 == 0){
            if(randomInt(100) >= 0){
                return bound;
            }else{
                return rand;
            }
        }else if(predicate.range){// 0<x<1, 0=<x<=1
            let left = parseInt(predicate.left);
            let right = parseInt(predicate.right);
            try {
                assert(left<=right);
                if(predicate.leftop=="<"){
                    left = left+1;
                }else if (predicate.leftop=="=<"){
                    left = left;
                }
                if(predicate.rightop=="<"){
                    right = right-1;
                }else if (predicate.rightop=="<="){
                    right = right;
                }
                let min = Math.min(left+10,right);
                // console.log(min);
                let lowerbound = randomInt(left,min);
                let max = Math.max(right-10,left);
                // console.log(max);
                let upperbound = randomInt(max, right);
                let rand = randomInt(left, right);
                let randNum = randomInt(100);
                if(randNum%3 == 0){
                    return lowerbound;
                }else if(randNum%3==1){
                    return rand;
                }else if(randNum%3==2){
                    return upperbound;
                }
            }catch(err){
                console.error(predicate);
                throw err;
            }
        }
    }
}

/// generate the call input
/// unum_min is defined, in most case it is 0
/// unum_max may not be defined, e.g., undefined
async function gen_callInput(abi, option) {

    let param_list = [];
    await abi.inputs.forEach(function (param) {
        param_list.push(generate_random(param.type));
    });
    if (option) {
        assert(option.static||option.predicates);
        if (option.static){
            for (let target of option.static) {
                param_list[target.index] = target.value;
            }
        }
        if(option.predicates){
            for(let target of option.predicates){
                param_list[target.index] = randgenPredicateValue(abi.inputs[target.index].type, target.predicate);
            }
        }
    }
    return param_list;
}

async function gen_callGasMax() {
    var gas_limit = "0x" + gasMax.toString(16);
    return gas_limit;
}
/// generate a call function based on the abi
async function gen_callFun(abi, address, option) {
    let parameters = await gen_callInput(abi, option);
    let gasLimit = await gen_callGasMax();
    let callFun = {
        /// g_account_list[0] is the initial account, which is also a miner account
        from: UserAccount,
        to: address,
        abi: abi,
        gas: gasLimit,
        param: parameters
    }
    return callFun;
}
/// add all the functions into the g_cand_sequence, then use g_cand_sequence to generate the call sequence
async function findCandSequence(target_abis, attack_abis, _targetContract) {
    g_targetContract = _targetContract;
    let cand_sequence = [];
    if (attack_abis) {
        await attack_abis.forEach(function (abi) {
            if (abi.type === 'function' && abi.constant == false) {
                let notsupport = false;

                let input_index = 0;
                let input_len = abi.inputs.length;
                while (input_index < input_len) {
                    var input = abi.inputs[input_index];
                    /// at present, we only support the types of "address", "uint*", and "int*"
                    if (input.type.indexOf('address') !== 0 && input.type.indexOf('uint') !== 0 && input.type.indexOf('int') !== 0) {
                        notsupport = true;
                        break;
                    }
                    input_index += 1;
                }
                /// change to all functions, because we use 0 as parameters
                if (!notsupport || notsupport) {
                    if (abi.name.indexOf("terminate") == -1) {
                        var abi_pair = [abi, g_attackContract.address]
                        cand_sequence.push(abi_pair);
                    }
                }
            }
        });
    }

    if (target_abis) {
        await target_abis.forEach(function (abi) {
            /// if abi.constant is true, it would not change state variables
            /// thus, it may not be a transaction if we call it
            if (abi.type === 'function' && abi.constant == false) {
                let notsupport = false;

                let input_len = abi.inputs.length;
                let input_index = 0;
                while (input_index < input_len) {
                    let input = abi.inputs[input_index];
                    /// at present, we only support the types of "address", "uint*", and "int*"
                    if (input.type.indexOf('address') !== 0 && input.type.indexOf('uint') !== 0 && input.type.indexOf('int') !== 0) {
                        notsupport = true;
                        break;
                    }
                    input_index += 1;
                }
                /// change to all functions, because we use 0 as parameters
                if (!notsupport || notsupport) {
                    if (abi.name.indexOf("terminate") == -1) {
                        let abi_pair = [abi, g_targetContract.address]
                        cand_sequence.push(abi_pair);
                    }
                }
            }
        });
    }
    return cand_sequence;
}

function types(inputs) {
    let input_types = [];
    if (inputs && inputs.length >= 1)
        for (let input of inputs)
            input_types.push(input.type);
    return input_types.join();
}


function write2file(file, content) {
    const fs = require("fs");
    fs.writeFile(file, content, function (err) {
        if (err) throw err;
        console.log(file + ' Saved!');
    });
}

function readJSON(file) {
    const fs = require("fs");
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}
exports.readJSON = readJSON;
exports.write2file = write2file;
exports.types = types;
exports.gen_callFun = gen_callFun;
exports.findCandSequence = findCandSequence;
exports.UserAccount = UserAccount;
exports.randomNum = randomNum;
