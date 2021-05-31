import { Bucket, BucketProps } from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import { Code, DockerImageCode, DockerImageFunction, Function } from '@aws-cdk/aws-lambda';
import { DockerImage, Duration } from '@aws-cdk/core';
import { Effect, ManagedPolicy, Policy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';

export class DeploymentStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const bucketName = this.getEnv('RADICASTER_S3_BUCKET');
    const bucketURL = this.getEnv('RADICASTER_BUCKET_URL');
    // TODO メールとパスワードは任意なのでエラー出ないように
    const radikoMail = this.getEnv('RADICASTER_RADIKO_MAIL');
    const radikoPassword = this.getEnv('RADICASTER_RADIKO_PASSWORD');

    // S3
    const bucketProps: BucketProps = {
      bucketName: bucketName,
      websiteIndexDocument: 'index.rss',
      publicReadAccess: true,
    };
    const bucket = new Bucket(this, 'bucket', bucketProps);

    // rec-radiko
    const funcRecRadiko = new DockerImageFunction(this, 'func-rec-radiko', {
      code: DockerImageCode.fromImageAsset(
        "../rec_radiko"
      ),
      timeout: Duration.minutes(10),
      memorySize: 768,
      environment: {
        // TODO Secrets Managerとか使う
        "RADICASTER_RADIKO_MAIL": radikoMail,
        "RADICASTER_RADIKO_PASSWORD": radikoPassword,
        "RADICASTER_S3_BUCKET": bucketName,
      }
    });
    funcRecRadiko.grantInvoke(new ServicePrincipal("events.amazonaws.com"));
    if (!funcRecRadiko.role) {
      throw new Error("funcRecRadiko.role is undefined");
    }
    bucket.grantPut(funcRecRadiko.role);

    // Image
    // new Function(this, 'lambda-rec-radiko', {
    //   functionName: 'rec-radiko',

    //   environment: {
    //     // TODO
    //   },
    // })

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
