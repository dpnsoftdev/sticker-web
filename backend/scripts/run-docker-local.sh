#!/bin/bash

IMAGE_NAME=server:local
DockerfileDir=..
DockerContainerName=server-local

cd $DockerfileDir

echo "Building image..."
docker build -t $IMAGE_NAME .

echo "Stopping old container if exists..."
docker rm -f $DockerContainerName 2>/dev/null || true

echo "Running container..."
docker run -d \
  --name $DockerContainerName \
  -p 3000:3000 \
  --env-file .env \
  $IMAGE_NAME

echo "Done. Server running at http://localhost:3000"