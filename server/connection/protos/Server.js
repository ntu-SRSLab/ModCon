var PROTO_PATH = __dirname + '/./modcon.proto';

var Grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });

var grpc = Grpc.loadPackageDefinition(packageDefinition).grpc;
/**
 * Implements the SendTransaction RPC method.
 */
function SendTransaction(call, callback) {
    console.log(call);
   if(call.request.method=="bid")
        callback(null, {status: "0", events:"bid"});
   else 
        callback(null, {status: "0", events:"other functions"});
}

/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
function main() {
  var server = new Grpc.Server();
  server.addService(grpc.ModCon.service, {SendTransaction: SendTransaction});
  server.bind('0.0.0.0:50051', Grpc.ServerCredentials.createInsecure());
  server.start();
}

main();