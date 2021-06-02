import { Bucket, BucketProps, EventType } from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import { Code, DockerImageCode, DockerImageFunction, Function } from '@aws-cdk/aws-lambda';
import { DockerImage, Duration } from '@aws-cdk/core';
import { Effect, ManagedPolicy, Policy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { S3EventSource } from '@aws-cdk/aws-lambda-event-sources';

interface Params {
  suffix: string;
  bucketName: string;
  bucketURL: string;
  radikoMail?: string;
  radikoPassword?: string;
}

export class RadicasterStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const params: Params = {
      suffix: this.getEnv('RADICASTER_CDK_SUFFIX') || '',
      bucketName: this.mustGetEnv("RADICASTER_S3_BUCKET"),
      bucketURL: this.mustGetEnv("RADICASTER_BUCKET_URL"),
      radikoMail: this.getEnv('RADICASTER_RADIKO_MAIL'),
      radikoPassword: this.getEnv('RADICASTER_RADIKO_PASSWORD'),
    }

    const bucket = this.setUpS3Bucket(params);
    this.setUpFuncRecRadiko(bucket, params);
    this.setUpFuncGenFeed(bucket, params);
  }

  private setUpS3Bucket(params: Params) {
    return new Bucket(this, 'bucket', {
      bucketName: params.bucketName,
      websiteIndexDocument: 'index.rss',
      publicReadAccess: true,
    });
  }

  private setUpFuncRecRadiko(bucket: Bucket, params: Params) {
    let recRadikoEnvironment
    if (params.radikoMail && params.radikoPassword) {
      recRadikoEnvironment = {
        "RADICASTER_RADIKO_MAIL": params.radikoMail,
        "RADICASTER_RADIKO_PASSWORD": params.radikoPassword,
        "RADICASTER_S3_BUCKET": params.bucketName
      };
    } else {
      recRadikoEnvironment = {
        "RADICASTER_S3_BUCKET": params.bucketName
      };
    }

    const funcRecRadiko = new DockerImageFunction(this, `func-rec-radiko`, {
      code: DockerImageCode.fromImageAsset(
        "../rec_radiko"
      ),
      functionName: `radicaster-rec-radiko${params.suffix}`,
      timeout: Duration.minutes(10),
      memorySize: 768,
      environment: recRadikoEnvironment,
    });
    funcRecRadiko.grantInvoke(new ServicePrincipal("events.amazonaws.com"));
    if (!funcRecRadiko.role) {
      throw new Error("funcRecRadiko.role is undefined");
    }
    bucket.grantPut(funcRecRadiko.role);
    return funcRecRadiko;
  }

  private setUpFuncGenFeed(bucket: Bucket, params: Params) {
    const funcGenFeed = new DockerImageFunction(this, `func-gen-feed`, {
      code: DockerImageCode.fromImageAsset(
        "../gen_feed"
      ),
      functionName: `radicaster-gen-feed${params.suffix}`,
      timeout: Duration.minutes(1),
      memorySize: 128,
      environment: {
        "RADICASTER_S3_BUCKET": params.bucketName,
        "RADICASTER_BUCKET_URL": params.bucketURL,
      }
    });
    funcGenFeed.grantInvoke(new ServicePrincipal("events.amazonaws.com"));
    if (!funcGenFeed.role) {
      throw new Error("funcGenFeed.role is undefined");
    }
    bucket.grantPut(funcGenFeed.role);
    bucket.grantRead(funcGenFeed.role);

    funcGenFeed.addEventSource(new S3EventSource(
      bucket,
      {
        events: [EventType.OBJECT_CREATED],
        filters: [{
          suffix: ".m4a"
        }],
      }
    ));
    return funcGenFeed;
  }

  private mustGetEnv(key: string): string {
    const value = this.getEnv(key);
    if (!value) {
      throw new Error(`environment variable ${key} must be set`);
    }
    return value;
  }

  private getEnv(key: string): string | undefined {
    return process.env[key];
  }
}
