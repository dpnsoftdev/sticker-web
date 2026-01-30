import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./envConfig";

export const createS3Client = (): S3Client => {
  const config: ConstructorParameters<typeof S3Client>[0] = {
    region: env.AWS_REGION,
  };
  if (env.AWS_ACCESS_KEY && env.AWS_SECRET_KEY) {
    config.credentials = {
      accessKeyId: env.AWS_ACCESS_KEY,
      secretAccessKey: env.AWS_SECRET_KEY,
    };
  }
  return new S3Client(config);
};
