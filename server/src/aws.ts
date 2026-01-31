import { AthenaClient } from '@aws-sdk/client-athena'
import { S3Client } from '@aws-sdk/client-s3'
import { AppConfig } from './config.js'

export function createAthenaClient(config: AppConfig) {
  return new AthenaClient({ region: config.region })
}

export function createS3Client(config: AppConfig) {
  return new S3Client({ region: config.region })
}
