// TransactionCacheTrie.js - super simple JS implementation
// https://en.wikipedia.org/wiki/TransactionCacheTrie

// -----------------------------------------

// we start with the TxTrieNode
// transaction: {method: methodName, raw_tx: raw_tx}
function TxTrieNode(transaction) {
  // the "transaction" value will be the transaction in sequence
  this.transaction = transaction;
  
  // we keep a reference to parent
  this.parent = null;
  
  // we have hash of children
  this.children = {};
  
  // check to see if the node is at the end
  this.end = false;
}

// iterates through the parents to get the transactions.
// time complexity: O(k), k = transactions length
TxTrieNode.prototype.getTransactions = function() {
  var output = [];
  var node = this;
  
  while (node !== null) {
    output.unshift(node.transaction);
    node = node.parent;
  }
  
  return output;
};

// iterates through the parents to get the transactions.
// time complexity: O(k), k = transactions length
TxTrieNode.prototype.addTransaction = function(transaction) {
  var node = this;
  node.end = false;
  node.children[transaction.method] = new TxTrieNode(transaction);
  // we also assign the parent to the child node.
  node.children[transaction.method].parent = node;
  node.children[transaction.method].end = true;
  return  node.children[transaction.method];
};

// -----------------------------------------

// we implement TransactionCacheTrie with just a simple root with null value.
function TransactionCacheTrie(deployTransaction) {
  this.root = new TxTrieNode(deployTransaction);
}

// inserts a transactions into the trie.
// time complexity: O(k), k = transactions length
TransactionCacheTrie.prototype.insert = function(transactions) {
  var node = this.root; // we start at the root 😬
  
  // for every transaction in the transactions
  for(var i = 0; i < transactions.length; i++) {
    // check to see if transaction node exists in children.
    if (!node.children[transactions[i].method]) {
      // if it doesn't exist, we then create it.
      node.children[transactions[i].method] = new TxTrieNode(transactions[i]);
      
      // we also assign the parent to the child node.
      node.children[transactions[i].method].parent = node;
    }
    
    // proceed to the next depth in the trie.
    node = node.children[transactions[i].method];
    
    // finally, we check to see if it's the last transactions.
    if (i == transactions.length-1) {
      // if it is, we set the end flag to true.
      node.end = true;
    }
  }
};

// check if it contains a whole method list.
// time complexity: O(k), k = methods length
TransactionCacheTrie.prototype.contains = function(methods) {
  var node = this.root;
  
  // for every transaction in the transactions
  for(var i = 0; i < methods.length; i++) {
    // check to see if transaction node exists in children.
    if (node.children[methods[i]]) {
      // if it exists, proceed to the next depth of the trie.
      node = node.children[methods[i]];
    } else {
      // doesn't exist, return false since it's not a valid transactions.
      return {ret:false, node:null};
    }
  }
  
  // we finished going through all the transactionss, but is it a whole transactions?
  return {ret:node.end, node:node};
};

// returns every transactions with given prefixMethods
// time complexity: O(p + n), p = prefixMethods length, n = number of child paths
TransactionCacheTrie.prototype.find = function(prefixMethods) {
  var node = this.root;
  var output = [];
  
  // for every transaction in the prefixMethods
  for(var i = 0; i < prefixMethods.length; i++) {
    // make sure prefixMethods actually has transactionss
    if (node.children[prefixMethods[i]]) {
      node = node.children[prefixMethods[i]];
    } else {
      // there's none. just return it.
      return output;
    }
  }
  
  // recursively find all transactionss in the node
  findAllWords(node, output);
  
  return output;
};

// recursive function to find all transactionss in the given node.
function findAllWords(node, arr) {
  // console.log(node);
  // base case, if node is at a transactions, push to output
  if (node.end) {
    arr.unshift(node.getTransactions());
  }
  
  // iterate through each children, call recursive findAllWords
  for (var child in node.children) {
    findAllWords(node.children[child], arr);
  }
}

function test(){
    // -----------------------------------------
    // instantiate our trie
    // var trie = new TransactionCacheTrie({method:"Create", raw_tx: {}});
    var trie = new TransactionCacheTrie(null);

    // insert few values
    trie.insert([{method:"hello", raw_tx: {}},{method:"helium", raw_tx: {}}]);
    trie.insert([{method:"hello", raw_tx: {}},{method:"world", raw_tx: {}}]);


    // check contains method
    console.log(trie.contains(["hello","helium"]).ret);  // true
    console.log(trie.contains(["hello","helium"]).node.getTransactions().slice(1));  // true
    console.log(trie.contains(["hello","hel"]).ret); // false
    // console.log(trie.contains(["hello"]).node.getTransactions()); // false

    // check find method
    console.log(trie.find(["hello"]));  // [ 'helium', 'hello' ]
    console.log(trie.find(["hello","helium"])); // [ 'hello' ]
    console.log(trie.find(["hello","helium","helo"])); // [ ]
    console.log(trie.find(["hell"]).length);  // [ ]
}
// test();

function tranlateToPredicates(predicatesStr){
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
// console.log(JSON.stringify(tranlateToPredicates("b=0")));
exports.TransactionCacheTrie = TransactionCacheTrie;
