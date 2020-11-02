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

function main() {
  var client = new grpc.ModCon('localhost:50051',
                                Grpc.credentials.createInsecure());
 
  var method = "helo";
  var parameters = "";                                         
  client.SendTransaction({method: method, parameters: parameters}, function(err, response) {
    console.log('Status:', response.status);
    console.log('Events:', response.events);
  });
}

main();