package org.learnlib.modcon.driver;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.stub.StreamObserver;
import org.learnlib.modcon.active.LStarDFALearner;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Logger;

public class BlockchainServer {
    private static final Logger logger = Logger.getLogger(BlockchainServer.class.getName());

    /* The port on which the server should run */
    private int port = 50051;
    private Server server;

    private void start() throws IOException {
        server = ServerBuilder.forPort(port)
                .addService(new ModConService())
                .build()
                .start();
        logger.info("Server started, listening on " + port);
        Runtime.getRuntime().addShutdownHook(new Thread() {
            @Override
            public void run() {
                // Use stderr here since the logger may have been reset by its JVM shutdown hook.
                System.err.println("*** shutting down gRPC server since JVM is shutting down");
                BlockchainServer.this.stop();
                System.err.println("*** server shut down");
            }
        });
    }

    private void stop() {
        if (server != null) {
            server.shutdown();
        }
    }
    /**
     * Main launches the server from the command line.
     */
    public static void main(String[] args) throws IOException, InterruptedException {
        final BlockchainServer server = new BlockchainServer();
        server.start();
        server.blockUntilShutdown();
    }

    /**
     * Await termination on the main thread since the grpc library uses daemon threads.
     */
    private void blockUntilShutdown() throws InterruptedException {
        if (server != null) {
            server.awaitTermination();
        }
    }

    BlockchainServer(){

    }

    private class ModConService extends  ModConGrpc.ModConImplBase{
        public ModConService(){

        }

        public void sendTransaction(Transaction request,
                                    io.grpc.stub.StreamObserver<TransactionReceipt> responseObserver) {
            String method = request.getMethod();
            String parameters = request.getParameters();
            if (!method.equals("hello") && parameters==""){
                String tmp = "1";
                try {
                    responseObserver.onNext(TransactionReceipt.newBuilder().setStatus("1").setEvents("").build());

                }catch (Exception e){

                }finally {

                }

            }else{
                responseObserver.onNext(TransactionReceipt.newBuilder().setStatus("0").setEvents("").build());
            }
            responseObserver.onCompleted();

        }
    }

}
