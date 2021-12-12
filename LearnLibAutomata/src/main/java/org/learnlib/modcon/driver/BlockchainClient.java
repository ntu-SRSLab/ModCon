package org.learnlib.modcon.driver;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.StatusRuntimeException;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;

public class BlockchainClient {
    private static BlockchainClient  client = null;
    private static final Logger logger = Logger.getLogger(BlockchainClient.class.getName());

    private final ManagedChannel channel;
    private final ModConGrpc.ModConBlockingStub blockingStub;

    public BlockchainClient() {
        String host = "localhost";
        int port = 50051;
        channel = ManagedChannelBuilder.forAddress(host, port)
                .usePlaintext()
                .build();
        blockingStub = ModConGrpc.newBlockingStub(channel);
    }
    /** Construct client connecting to HelloWorld server at {@code host:port}. */
    public BlockchainClient(String host, int port) {

        channel = ManagedChannelBuilder.forAddress(host, port)
                .usePlaintext()
                .build();
        blockingStub = ModConGrpc.newBlockingStub(channel);
    }
    public void shutdown() throws InterruptedException {
        channel.shutdown().awaitTermination(5, TimeUnit.SECONDS);
    }

    /** Say hello to server. */
    public Boolean greet(String uniqueId, String name) {
        logger.info("Will try to invoke function " + name + " ...");
        Transaction request = Transaction.newBuilder().setUniqueId(uniqueId).setMethod(name).setParameters("").build();
        TransactionReceipt response;
        try {
            response = blockingStub.sendTransaction(request);
        } catch (StatusRuntimeException e) {
            logger.log(Level.WARNING, "RPC failed: {0}", e.getStatus());
            return false;
        }
        logger.info(name + ": " + response.getStatus() + " Events: "+response.getEvents());
        return  response.getStatus().equals("1");
    }

    public Boolean greetQuery(String uniqueId, String query){
        logger.info("Will try to query: " + query );
        Query request = Query.newBuilder().setUniqueId(uniqueId).setQuery(query).build();
        QueryReceipt response;
        try {
            response = blockingStub.sendQuery(request);
        } catch (StatusRuntimeException e) {
            logger.log(Level.WARNING, "RPC failed: {0}", e.getStatus());
            return false;
        }
        logger.info(query + ": " + response.getStatus() + " Events: "+response.getEvents());
        return  response.getStatus().equals("1");
    }
    public
    String greetQueryWithOutput(String uniqueId, String query){
        logger.info("Will try to query: " + query );
        Query request = Query.newBuilder().setHasStateOutput(true).setUniqueId(uniqueId).setQuery(query).build();
        QueryReceipt response;
        try {
            response = blockingStub.sendQuery(request);
        } catch (StatusRuntimeException e) {
            logger.log(Level.WARNING, "RPC failed: {0}", e.getStatus());
            return null;
        }
        logger.info(query + ": " + response.getStatus() + " Events: "+response.getEvents());
        return  response.getStatus();
    }

    public static final BlockchainClient getDefaultInstance(){
        if (client==null)
            client =  new BlockchainClient("localhost", 50051);
        return  client;
    }

    public static void main(String[] args) throws NoSuchMethodException, IOException {
        BlockchainClient client = BlockchainClient.getDefaultInstance();
//        String query = "IngestTelemetry 10=<a<=50,0=<b<=100-->TransferResponsibility-->Complete";
        String query = "IngestTelemetry 0<a<=45,10=<b<=65-->TransferResponsibility";
//        String query = "bid 0=<a<=10-->bid 0=<a<=10-->cancelABB 0=<a<=10-->unbid 0=<a<=10";
        String state = client.greetQueryWithOutput("", query);
        logger.info("State: " + state);
    }
    }