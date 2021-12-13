package org.learnlib.modcon.driver;

import static io.grpc.MethodDescriptor.generateFullMethodName;
import static io.grpc.stub.ClientCalls.asyncBidiStreamingCall;
import static io.grpc.stub.ClientCalls.asyncClientStreamingCall;
import static io.grpc.stub.ClientCalls.asyncServerStreamingCall;
import static io.grpc.stub.ClientCalls.asyncUnaryCall;
import static io.grpc.stub.ClientCalls.blockingServerStreamingCall;
import static io.grpc.stub.ClientCalls.blockingUnaryCall;
import static io.grpc.stub.ClientCalls.futureUnaryCall;
import static io.grpc.stub.ServerCalls.asyncBidiStreamingCall;
import static io.grpc.stub.ServerCalls.asyncClientStreamingCall;
import static io.grpc.stub.ServerCalls.asyncServerStreamingCall;
import static io.grpc.stub.ServerCalls.asyncUnaryCall;
import static io.grpc.stub.ServerCalls.asyncUnimplementedStreamingCall;
import static io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall;

/**
 * <pre>
 * Server Interface Class
 * </pre>
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.33.1)",
    comments = "Source: modcon.proto")
public final class ModConGrpc {

  private ModConGrpc() {}

  public static final String SERVICE_NAME = "grpc.ModCon";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<org.learnlib.modcon.driver.Transaction,
      org.learnlib.modcon.driver.TransactionReceipt> getSendTransactionMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "SendTransaction",
      requestType = org.learnlib.modcon.driver.Transaction.class,
      responseType = org.learnlib.modcon.driver.TransactionReceipt.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<org.learnlib.modcon.driver.Transaction,
      org.learnlib.modcon.driver.TransactionReceipt> getSendTransactionMethod() {
    io.grpc.MethodDescriptor<org.learnlib.modcon.driver.Transaction, org.learnlib.modcon.driver.TransactionReceipt> getSendTransactionMethod;
    if ((getSendTransactionMethod = ModConGrpc.getSendTransactionMethod) == null) {
      synchronized (ModConGrpc.class) {
        if ((getSendTransactionMethod = ModConGrpc.getSendTransactionMethod) == null) {
          ModConGrpc.getSendTransactionMethod = getSendTransactionMethod =
              io.grpc.MethodDescriptor.<org.learnlib.modcon.driver.Transaction, org.learnlib.modcon.driver.TransactionReceipt>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "SendTransaction"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  org.learnlib.modcon.driver.Transaction.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  org.learnlib.modcon.driver.TransactionReceipt.getDefaultInstance()))
              .setSchemaDescriptor(new ModConMethodDescriptorSupplier("SendTransaction"))
              .build();
        }
      }
    }
    return getSendTransactionMethod;
  }

  private static volatile io.grpc.MethodDescriptor<org.learnlib.modcon.driver.Query,
      org.learnlib.modcon.driver.QueryReceipt> getSendQueryMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "SendQuery",
      requestType = org.learnlib.modcon.driver.Query.class,
      responseType = org.learnlib.modcon.driver.QueryReceipt.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<org.learnlib.modcon.driver.Query,
      org.learnlib.modcon.driver.QueryReceipt> getSendQueryMethod() {
    io.grpc.MethodDescriptor<org.learnlib.modcon.driver.Query, org.learnlib.modcon.driver.QueryReceipt> getSendQueryMethod;
    if ((getSendQueryMethod = ModConGrpc.getSendQueryMethod) == null) {
      synchronized (ModConGrpc.class) {
        if ((getSendQueryMethod = ModConGrpc.getSendQueryMethod) == null) {
          ModConGrpc.getSendQueryMethod = getSendQueryMethod =
              io.grpc.MethodDescriptor.<org.learnlib.modcon.driver.Query, org.learnlib.modcon.driver.QueryReceipt>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "SendQuery"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  org.learnlib.modcon.driver.Query.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  org.learnlib.modcon.driver.QueryReceipt.getDefaultInstance()))
              .setSchemaDescriptor(new ModConMethodDescriptorSupplier("SendQuery"))
              .build();
        }
      }
    }
    return getSendQueryMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static ModConStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ModConStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ModConStub>() {
        @java.lang.Override
        public ModConStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ModConStub(channel, callOptions);
        }
      };
    return ModConStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static ModConBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ModConBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ModConBlockingStub>() {
        @java.lang.Override
        public ModConBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ModConBlockingStub(channel, callOptions);
        }
      };
    return ModConBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static ModConFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<ModConFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<ModConFutureStub>() {
        @java.lang.Override
        public ModConFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new ModConFutureStub(channel, callOptions);
        }
      };
    return ModConFutureStub.newStub(factory, channel);
  }

  /**
   * <pre>
   * Server Interface Class
   * </pre>
   */
  public static abstract class ModConImplBase implements io.grpc.BindableService {

    /**
     * <pre>
     * Interface Method
     * </pre>
     */
    public void sendTransaction(org.learnlib.modcon.driver.Transaction request,
        io.grpc.stub.StreamObserver<org.learnlib.modcon.driver.TransactionReceipt> responseObserver) {
      asyncUnimplementedUnaryCall(getSendTransactionMethod(), responseObserver);
    }

    /**
     */
    public void sendQuery(org.learnlib.modcon.driver.Query request,
        io.grpc.stub.StreamObserver<org.learnlib.modcon.driver.QueryReceipt> responseObserver) {
      asyncUnimplementedUnaryCall(getSendQueryMethod(), responseObserver);
    }

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
          .addMethod(
            getSendTransactionMethod(),
            asyncUnaryCall(
              new MethodHandlers<
                org.learnlib.modcon.driver.Transaction,
                org.learnlib.modcon.driver.TransactionReceipt>(
                  this, METHODID_SEND_TRANSACTION)))
          .addMethod(
            getSendQueryMethod(),
            asyncUnaryCall(
              new MethodHandlers<
                org.learnlib.modcon.driver.Query,
                org.learnlib.modcon.driver.QueryReceipt>(
                  this, METHODID_SEND_QUERY)))
          .build();
    }
  }

  /**
   * <pre>
   * Server Interface Class
   * </pre>
   */
  public static final class ModConStub extends io.grpc.stub.AbstractAsyncStub<ModConStub> {
    private ModConStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ModConStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ModConStub(channel, callOptions);
    }

    /**
     * <pre>
     * Interface Method
     * </pre>
     */
    public void sendTransaction(org.learnlib.modcon.driver.Transaction request,
        io.grpc.stub.StreamObserver<org.learnlib.modcon.driver.TransactionReceipt> responseObserver) {
      asyncUnaryCall(
          getChannel().newCall(getSendTransactionMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void sendQuery(org.learnlib.modcon.driver.Query request,
        io.grpc.stub.StreamObserver<org.learnlib.modcon.driver.QueryReceipt> responseObserver) {
      asyncUnaryCall(
          getChannel().newCall(getSendQueryMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * <pre>
   * Server Interface Class
   * </pre>
   */
  public static final class ModConBlockingStub extends io.grpc.stub.AbstractBlockingStub<ModConBlockingStub> {
    private ModConBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ModConBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ModConBlockingStub(channel, callOptions);
    }

    /**
     * <pre>
     * Interface Method
     * </pre>
     */
    public org.learnlib.modcon.driver.TransactionReceipt sendTransaction(org.learnlib.modcon.driver.Transaction request) {
      return blockingUnaryCall(
          getChannel(), getSendTransactionMethod(), getCallOptions(), request);
    }

    /**
     */
    public org.learnlib.modcon.driver.QueryReceipt sendQuery(org.learnlib.modcon.driver.Query request) {
      return blockingUnaryCall(
          getChannel(), getSendQueryMethod(), getCallOptions(), request);
    }
  }

  /**
   * <pre>
   * Server Interface Class
   * </pre>
   */
  public static final class ModConFutureStub extends io.grpc.stub.AbstractFutureStub<ModConFutureStub> {
    private ModConFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected ModConFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new ModConFutureStub(channel, callOptions);
    }

    /**
     * <pre>
     * Interface Method
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<org.learnlib.modcon.driver.TransactionReceipt> sendTransaction(
        org.learnlib.modcon.driver.Transaction request) {
      return futureUnaryCall(
          getChannel().newCall(getSendTransactionMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<org.learnlib.modcon.driver.QueryReceipt> sendQuery(
        org.learnlib.modcon.driver.Query request) {
      return futureUnaryCall(
          getChannel().newCall(getSendQueryMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_SEND_TRANSACTION = 0;
  private static final int METHODID_SEND_QUERY = 1;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final ModConImplBase serviceImpl;
    private final int methodId;

    MethodHandlers(ModConImplBase serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_SEND_TRANSACTION:
          serviceImpl.sendTransaction((org.learnlib.modcon.driver.Transaction) request,
              (io.grpc.stub.StreamObserver<org.learnlib.modcon.driver.TransactionReceipt>) responseObserver);
          break;
        case METHODID_SEND_QUERY:
          serviceImpl.sendQuery((org.learnlib.modcon.driver.Query) request,
              (io.grpc.stub.StreamObserver<org.learnlib.modcon.driver.QueryReceipt>) responseObserver);
          break;
        default:
          throw new AssertionError();
      }
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public io.grpc.stub.StreamObserver<Req> invoke(
        io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        default:
          throw new AssertionError();
      }
    }
  }

  private static abstract class ModConBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    ModConBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return org.learnlib.modcon.driver.ModConServiceProto.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("ModCon");
    }
  }

  private static final class ModConFileDescriptorSupplier
      extends ModConBaseDescriptorSupplier {
    ModConFileDescriptorSupplier() {}
  }

  private static final class ModConMethodDescriptorSupplier
      extends ModConBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final String methodName;

    ModConMethodDescriptorSupplier(String methodName) {
      this.methodName = methodName;
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.MethodDescriptor getMethodDescriptor() {
      return getServiceDescriptor().findMethodByName(methodName);
    }
  }

  private static volatile io.grpc.ServiceDescriptor serviceDescriptor;

  public static io.grpc.ServiceDescriptor getServiceDescriptor() {
    io.grpc.ServiceDescriptor result = serviceDescriptor;
    if (result == null) {
      synchronized (ModConGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new ModConFileDescriptorSupplier())
              .addMethod(getSendTransactionMethod())
              .addMethod(getSendQueryMethod())
              .build();
        }
      }
    }
    return result;
  }
}
