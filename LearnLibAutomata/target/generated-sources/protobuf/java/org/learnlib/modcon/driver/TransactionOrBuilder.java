// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: modcon.proto

package org.learnlib.modcon.driver;

public interface TransactionOrBuilder extends
    // @@protoc_insertion_point(interface_extends:grpc.Transaction)
    com.google.protobuf.MessageOrBuilder {

  /**
   * <code>string uniqueId = 1;</code>
   * @return The uniqueId.
   */
  java.lang.String getUniqueId();
  /**
   * <code>string uniqueId = 1;</code>
   * @return The bytes for uniqueId.
   */
  com.google.protobuf.ByteString
      getUniqueIdBytes();

  /**
   * <code>string method = 2;</code>
   * @return The method.
   */
  java.lang.String getMethod();
  /**
   * <code>string method = 2;</code>
   * @return The bytes for method.
   */
  com.google.protobuf.ByteString
      getMethodBytes();

  /**
   * <code>string parameters = 3;</code>
   * @return The parameters.
   */
  java.lang.String getParameters();
  /**
   * <code>string parameters = 3;</code>
   * @return The bytes for parameters.
   */
  com.google.protobuf.ByteString
      getParametersBytes();
}
