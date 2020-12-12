var PROTO_PATH = __dirname + '/./modcon.proto';

var Grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');
const { result } = require('lodash');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });

var grpc = Grpc.loadPackageDefinition(packageDefinition).grpc;

var membershipQueryEngine;

function setMembershipQueryEngine(mqEngine){
  membershipQueryEngine = mqEngine;
}
/**
 * Implements the SendTransaction RPC method.
 */
function SendTransaction(call, callback) {
   console.log(call);
   if (call.request.method == "Create"){
     membershipQueryEngine.reset(call.request.uniqueId).then(result =>{
        callback(null, {status: "1", events:"Deployment Success"});
     }).catch(err=>{
        callback(null, {status: "0", events:"Deployment Failure"});
     });
   }else{
      membershipQueryEngine.fuzz(call.request.uniqueId, call.request.method).then(result =>{
          callback(null,   {status: result?"1":"0", events:"Transaction Result (1: Success, 0: Failure)"});
      }).catch(err=>{
          console.log(err);
          callback(null, {status: "0", events:"Unknown Transaction Failure"});
      });
   }
}

/**
 * Implements the SendQuery RPC method.
 */
function SendQuery(call, callback) {
  if(!call.request.hasStateOutput)
     membershipQueryEngine.answerQueryWithAbstractionRefinement(call.request.uniqueId, call.request.query).then(result =>{
      if(!result.rules){
         callback(null,   {status: result.status?"1":"0", events:"Query Result (1: Success, 0: Failure)"});
      }else{
         callback(null,   {status: result.status?"1":"0", events:"Query Result (1: Success, 0: Failure)\n Rules:" + result.rules});
      }
     }).catch(err=>{
         console.log(err);
         callback(null, {status: "0", events:"Unknown server failure"});
     });
  else 
    membershipQueryEngine.answerQueryWithAbstractionRefinement(call.request.uniqueId, call.request.query, call.request.hasStateOutput).then(result =>{
      if(!result.rules){
          callback(null,   {status: result.state, events:"State Output (404: nonexist; -1: call failure; 0,1,...,n: state value.)"});
      }else{
        callback(null,   {status: result.state, events:"State Output (404: nonexist; -1: call failure; 0,1,...,n: state value.)\n Rules:" + result.rules});
      }
    }).catch(err=>{
        console.log(err);
        callback(null, {status: "405", events:"Unknown server failure"});
    });
}


/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
function bootstrap() {
  var server = new Grpc.Server();
  server.addService(grpc.ModCon.service, {SendTransaction: SendTransaction, SendQuery: SendQuery});
  // server.addService(grpc.ModCon.service, {SendQuery: SendQuery});
  server.bind('0.0.0.0:50051', Grpc.ServerCredentials.createInsecure());
  server.start();
  console.log("grpc server '0.0.0.0:50051' is listening");
}
// bootstrap();
exports.bootstrap = bootstrap;
exports.setMembershipQueryEngine = setMembershipQueryEngine;