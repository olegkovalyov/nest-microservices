#!/bin/bash

# Set the base directory relative to the script location or project root
BASE_DIR=$(pwd)
PROTO_DIR="$BASE_DIR/libs/common/proto"
OUT_DIR="$BASE_DIR/libs/common/src/grpc/user"
# Point directly to the script inside the ts-proto package directory
TS_PROTO_BIN="$BASE_DIR/node_modules/ts-proto/protoc-gen-ts_proto"

# Ensure ts-proto binary exists
if [ ! -f "$TS_PROTO_BIN" ]; then
    echo "Error: ts-proto script not found at $TS_PROTO_BIN" >&2
    echo "Please ensure ts-proto is installed correctly: npm install --save-dev ts-proto" >&2
    exit 1
fi

# Ensure ts-proto binary is executable
if [ ! -x "$TS_PROTO_BIN" ]; then
    echo "ts-proto script at $TS_PROTO_BIN is not executable. Attempting to fix..." >&2
    chmod +x "$TS_PROTO_BIN"
    if [ ! -x "$TS_PROTO_BIN" ]; then
        echo "Failed to make ts-proto script executable. Please check permissions manually." >&2
        exit 1
    fi
fi

# Create output directory if it doesn't exist
mkdir -p "$OUT_DIR"

# Run protoc using npx (to potentially find protoc) and explicitly point to ts-proto plugin script
echo "Running protoc with ts-proto plugin script: $TS_PROTO_BIN"
npx protoc \
  --plugin="protoc-gen-ts_proto=$TS_PROTO_BIN" \
  --ts_proto_out="$OUT_DIR" \
  --ts_proto_opt="nestJs=true,outputServices=grpc-js,addGrpcMetadataImport=true,env=node,forceLong=string,outputPartialMethods=true,useDate=true" \
  --proto_path="$PROTO_DIR" \
  "$PROTO_DIR/user-service.proto"

# Check the exit code of protoc
if [ $? -ne 0 ]; then
  echo "Error: protoc command failed." >&2
  exit 1
fi

echo " Protobuf code generated successfully in $OUT_DIR"
