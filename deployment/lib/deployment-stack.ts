import { BlockPublicAccess, Bucket, BucketProps } from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';

export class DeploymentStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const bucketName = this.getEnv('RADICASTER_S3_BUCKET');
    const bucketURL = this.getEnv('RADICASTER_BUCKET_URL');

    // S3
    const bucketProps: BucketProps = {
      bucketName: bucketName,
      websiteIndexDocument: 'index.rss',
      publicReadAccess: true,
    };
    const bucket = new Bucket(this, 'bucket', bucketProps);

    // rec-radiko
    // - Lambda作る
    // - ECRのリポジトリ作る？

    // gen-feed
    // - Lambda作る
    // - ECRのリポジトリ作る？
    // - バケットのイベントから発火するように

  }

  private getEnv(key: string): string {
    const value = process.env[key]
    if (!value) {
      throw new Error(`environment variable ${key} must be set`);
    }
    return value;
  }
}
