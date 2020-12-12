

const dt = require("./decision-tree").dt;
const { isNumber } = require("lodash");
const randomInt = require("random-int");
const Stack = require("stack-lifo");
const assert = require("assert");
const { type } = require("os");
// object_equal ignore "output"
function object_equals( x, y, ignoreAttributes ) {
    let ignoreSet = new Set(ignoreAttributes);
    ignoreSet.add("output");
    if ( x === y ) return true;
      // if both x and y are null or undefined and exactly the same
  
    if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
      // if they are not strictly equal, they both need to be Objects
  
    if ( x.constructor !== y.constructor ) return false;
      // they must have the exact same prototype chain, the closest we can do is
      // test there constructor.
  
    for ( var p in x ) {
      if(false == ignoreSet.has(p)){
        if ( ! x.hasOwnProperty( p ) ) continue;
            // other properties were tested using x.constructor === y.constructor
    
        if ( ! y.hasOwnProperty( p ) ) return false;
            // allows to compare x[ p ] and y[ p ] when set to undefined
    
        if ( x[ p ] === y[ p ] ) continue;
            // if they have the same strict value or identity then they are equal
    
        if ( typeof( x[ p ] ) !== "object" ) return false;
            // Numbers, Strings, Functions, Booleans must be strictly equal
    
        if ( ! object_equals( x[ p ],  y[ p ] ) ) return false;
            // Objects and Arrays must be tested recursively
      }
    }
  
    for ( p in y ){
      if(false == ignoreSet.has(p)){
        if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) )
            return false;
      }
    }
    // allows x[ p ] to be set to undefined
    return true;
}
function notPredicate(predicateName){
    if(predicateName==">"){
        return "<=";
    }else if (predicateName == ">="){
        return "<";
    }else if (predicateName == "="){
        return "!=";
    }else if (predicateName == "<="){
        return ">";
    }else if (predicateName == "<"){
        return ">=";
    }
}
class DecisionTree{
    constructor(config){
        this.stack = new Stack();
        this.stack.push("true");
        this.trainingDataSet = new Array();
        this.conflictCount = 0;
        this.config = {
            trainingSet: this.trainingDataSet, 
            categoryAttr: 'output',
            ignoredAttributes:[]
        };
        // this.config = config;
        if (config && config.ignoredAttributes){
            this.config.ignoredAttributes = config.ignoredAttributes;
        }
    }
    addItem(item){
        // find conflict (input, output) pair where same inputs have different output
        let conflicts = this.trainingDataSet.filter(x => {
            return object_equals(x,item, this.config.ignoreAttributes) && x.output != item.output;
        });

        if(conflicts.length>0){
            // conflict
            if(conflicts[0].output.indexOf("conflict")==-1){
                // maintain only one inputs copy in the training data
                for (let conflict of conflicts){
                    // if(conflict.output.indexOf("conflict")==-1){
                        // set output = "conflict#id"
                        // we use conflict#id to distinguish different inputs causing conflicts
                        conflict.output = "conflict#"+this.conflictCount;
                }
                this.conflictCount++;
            }else {
                // ignore current item
                // do nothing 
            }


        }else{
            this.trainingDataSet.push(item);
        }
    }
    addTrainingData(dataArr){
        if(this.trainingDataSet.length==0){
            this.trainingDataSet.push(...dataArr);
        }else {
            for (let item of dataArr){
                this.addItem(item);
            }
        }
    }

    startTraining(){
        this.decisionTree = new dt.DecisionTree(this.config);
    }

    predict(example, actualoutput){
        return actualoutput==this.decisionTree.predict(example);
    }
    traverse(tree){
        if(tree){
            if (tree.category){
                this.rules.push(this.stack.peek().replace("true;",""));
                console.log("Rule: ", this.stack.peek().replace("true;",""));
                console.log("Category: ", tree.category);          
            }else {
                // console.log(tree.attribute, tree.predicateName, tree.pivot);
                this.stack.push(this.stack.peek()+"; "+tree.attribute +" "+ tree.predicateName +" "+ tree.pivot);
                this.traverse(tree.match);
                this.stack.pop();
                this.stack.push(this.stack.peek()+"; "+tree.attribute +" "+notPredicate(tree.predicateName) +" "+ tree.pivot)
                this.traverse(tree.notMatch);
                this.stack.pop();
            }
        }
    }
    outputRules(){
        // console.log(JSON.stringify(this.decisionTree.root,null, "  "));
        this.rules = new Array();
        this.traverse(this.decisionTree.root);
        return this.rules;
    }
}

let transitionCount = 0;
function generateTransitionRandomData(N){
        
    let data = [];
    let TIME_LIMIT = 20;
    if (N && isNumber(N)){
        TIME_LIMIT = N;
    }
    for(let i=0; i< TIME_LIMIT; i++){
        let transition = randomInt(0, 20);
        if(transition == transitionCount){
            data.push({transition: transition, output: "pass"});
        }else{
            data.push({transition: transition, output: "failed"});
        }
    }
    console.log("generation rule (pass):", "transition == transitionCount");
    transitionCount ++;
    return data;
}


function generateRandomData(N){
    let data = [];
    let a = 10, b = 80;
    let c = 20, d = 50;
    let TIME_LIMIT = 20;
    if (N && isNumber(N)){
        TIME_LIMIT = N;
    }
    for(let i=0; i< TIME_LIMIT; i++){
        let temperature = randomInt(0, 100);
        let humidity = randomInt(0, 100);
        if(temperature>=a && temperature<=b && humidity>=c && humidity<=d){
            data.push({temperature: temperature, humidity: humidity, output: "pass"});
        }else{
            data.push({temperature: temperature, humidity: humidity, output: "failed"});
        }
    }
    console.log("generation rule (pass):", a, "=< temperature <=", b, "; ", c, "=< humidity <=", d);
    return data;
}


function test(){
    // Training set
    var data = 
        [{person: 'Homer', hairLength: 0, weight: 250, age: 36, output: 'male'},
        {person: 'Marge', hairLength: 10, weight: 150, age: 34, output: 'female'},
        {person: 'Bart', hairLength: 2, weight: 90, age: 10, output: 'male'},
        {person: 'Lisa', hairLength: 6, weight: 78, age: 8, output: 'female'},
        {person: 'Maggie', hairLength: 4, weight: 20, age: 1, output: 'female'},
        {person: 'Abe', hairLength: 1, weight: 170, age: 70, output: 'male'},
        {person: 'Selma', hairLength: 8, weight: 160, age: 41, output: 'female'},
        {person: 'Otto', hairLength: 10, weight: 180, age: 38, output: 'male'},
        {person: 'Krusty', hairLength: 6, weight: 200, age: 45, output: 'male'}];

    // Configuration
    var config = {
        trainingSet: data, 
        categoryAttr: 'output', 
        ignoredAttributes: ['person']
    };

    // Building Decision Tree
    var decisionTree = new dt.DecisionTree(config);

    // Testing Decision Tree 
    var comic = {person: 'Comic guy', hairLength: 8, weight: 169, age: 38};

    var decisionTreePrediction = decisionTree.predict(comic);

    console.log(comic);
    console.log(decisionTreePrediction);


    // let dtree = new DecisionTree(config);
    // dtree.addTrainingData(data);
    // dtree.startTraining();
    // dtree.outputRules();

    let dtree2 = new DecisionTree();
    dtree2.addTrainingData(generateRandomData(60))
    dtree2.startTraining();
    dtree2.outputRules();

    console.log("\n");

    let dtree3 = new DecisionTree();
    dtree3.addTrainingData(generateTransitionRandomData(20))
    dtree3.startTraining();
    // dtree3.outputRules();


    dtree3.addTrainingData(generateTransitionRandomData(20))
    dtree3.startTraining();
    // dtree3.outputRules();

    dtree3.addTrainingData(generateTransitionRandomData(20))
    dtree3.startTraining();
    // dtree3.outputRules();

    dtree3.addTrainingData(generateTransitionRandomData(20))
    dtree3.startTraining();
    // dtree3.outputRules();

    dtree3.addTrainingData(generateTransitionRandomData(20))
    dtree3.startTraining();
    // dtree3.outputRules();

    dtree3.addTrainingData(generateTransitionRandomData(20))
    dtree3.startTraining();
    // dtree3.outputRules();

    dtree3.addTrainingData(generateTransitionRandomData(20))
    dtree3.startTraining();
    dtree3.outputRules();

    console.log("\n");
    // console.log(dtree3.trainingDataSet);


}


/**
 * 
 * @param {string} method: function name
 * @param {Object} input: concrete parameters value {temperature: 10, humidity: 20}
 * @param {string} output: true: success, false: reverted
 */
let tree = new Map();
function addMethodInputWithOutput(method, input, output){
    let types = method.split("(")[1].split(")")[0].split(",");
    console.log(types);
    let ignoredAttributes = [];
    let data = new Object();
    let count = 0;
    for (let param of input){
        data[String.fromCharCode("a".charCodeAt(0)+count)] = param;
        // console.log(types[count], types[count].indexOf("[")!=-1 ,types[count].indexOf("byte")!=-1 , types[count].indexOf("string")!=-1);
        if(types[count].indexOf("[")!=-1  
        || types[count].indexOf("byte")!=-1  
        || types[count].indexOf("string")!=-1){
            ignoredAttributes.push(String.fromCharCode("a".charCodeAt(0)+count));
        }
        count ++;
    }
    data.output = output.toString();
   
    if (!tree[method]){
        if (ignoredAttributes){
            console.log("ignoreAttributes: ", ignoredAttributes);
            tree[method] = new DecisionTree({ignoredAttributes: ignoredAttributes});
        }else {
            tree[method] = new DecisionTree();
        }
       
    }
    tree[method].addItem(data);
   
}
function getMethodInputRules(method){
    // console.log(method, " ", tree.has(method), tree[method], tree);
    if(tree[method]){
        console.log(tree[method]);
        tree[method].startTraining();
        return tree[method].outputRules();
    }
    return null;
}

exports.addMethodInputWithOutput = addMethodInputWithOutput;
exports.getMethodInputRules = getMethodInputRules;