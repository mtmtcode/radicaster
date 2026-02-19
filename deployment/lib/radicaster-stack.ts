import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { CachePolicy, Distribution, LambdaEdgeEventType, OriginAccessIdentity, ViewerProtocolPolicy, experimental } from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { CanonicalUserPrincipal, Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, DockerImageCode, DockerImageFunction, Runtime, RuntimeFamily } from 'aws-cdk-lib/aws-lambda';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { SnsDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { LambdaSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cdk from 'aws-cdk-lib';
import { CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';
import * as path from 'path';

interface Params {
  suffix: string;
  bucketName: string;
  customDomain?: string;
  customDomainCertificateARN?: string
  basicAuthUser: string
  basicAuthPassword: string
  radikoMail?: string;
  radikoPassword?: string;
}

export class RadicasterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const params: Params = {
      suffix: this.getEnv('RADICASTER_CDK_SUFFIX') || '',
      bucketName: this.mustGetEnv("RADICASTER_S3_BUCKET"),
      customDomain: this.getEnv('RADICASTER_CUSTOM_DOMAIN'),
      customDomainCertificateARN: this.getEnv('RADICASTER_CUSTOM_DOMAIN_CERT_ARN'),
      basicAuthUser: this.mustGetEnv("RADICASTER_BASIC_AUTH_USER"),
      basicAuthPassword: this.mustGetEnv("RADICASTER_BASIC_AUTH_PASSWORD"),
      radikoMail: this.getEnv('RADICASTER_RADIKO_MAIL'),
      radikoPassword: this.getEnv('RADICASTER_RADIKO_PASSWORD'),
    }

    const { bucket, uploadTopic } = this.setUpS3(params);
    const dist = this.setUpCloudFront(bucket, params);
    this.setUpFuncRecRadiko(bucket, params);
    this.setUpFuncGenFeed(bucket, dist, params, uploadTopic);
    this.setUpFuncCleanupEpisodes(bucket, params, uploadTopic);
  }

  private setUpS3(params: Params) {
    const bucket = new Bucket(this, 'bucket', {
      bucketName: params.bucketName,
    });
    const uploadTopic = new Topic(this, 'upload-topic');
    bucket.addEventNotification(EventType.OBJECT_CREATED, new SnsDestination(uploadTopic), { suffix: '.m4a' });
    return { bucket, uploadTopic };
  }

  private setUpFuncRecRadiko(bucket: Bucket, params: Params) {
    let recRadikoEnvironment: { [key: string]: string } = {};
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
    bucket.grantRead(funcRecRadiko.role);
    bucket.grantPut(funcRecRadiko.role);

    new CfnOutput(this, `RecRadikoARN`, {
      value: funcRecRadiko.functionArn,
      description: 'ARN of rec-radiko function'
    });

    return funcRecRadiko;
  }

  private setUpFuncGenFeed(bucket: Bucket, dist: Distribution, params: Params, topic: Topic) {
    const authPrefix = `${params.basicAuthUser}:${params.basicAuthPassword}@`
    const domainName = params.customDomain || dist.domainName;
    const funcGenFeed = new NodejsFunction(this, `func-gen-feed`, {
      entry: path.join(__dirname, '../../gen_feed/src/handler.ts'),
      handler: 'handler',
      runtime: new Runtime('nodejs24.x', RuntimeFamily.NODEJS),
      functionName: `radicaster-gen-feed-node${params.suffix}`,
      timeout: Duration.minutes(1),
      memorySize: 128,
      environment: {
        "RADICASTER_S3_BUCKET": params.bucketName,
        "RADICASTER_BUCKET_URL": `https://${authPrefix}${domainName}`,
      },
      bundling: {
        forceDockerBundling: false,
        sourceMap: true,
        minify: true,
      }
    });
    funcGenFeed.grantInvoke(new ServicePrincipal("events.amazonaws.com"));
    if (!funcGenFeed.role) {
      throw new Error("funcGenFeed.role is undefined");
    }
    bucket.grantRead(funcGenFeed.role);
    bucket.grantPut(funcGenFeed.role);

    topic.addSubscription(new LambdaSubscription(funcGenFeed));
    return funcGenFeed;
  }

  private setUpFuncCleanupEpisodes(bucket: Bucket, params: Params, topic: Topic) {
    const funcCleanup = new DockerImageFunction(this, `func-cleanup-episodes`, {
      code: DockerImageCode.fromImageAsset(
        "../cleanup_episodes"
      ),
      functionName: `radicaster-cleanup-episodes${params.suffix}`,
      timeout: Duration.minutes(1),
      memorySize: 128,
      environment: {
        "RADICASTER_S3_BUCKET": params.bucketName,
      }
    });
    if (!funcCleanup.role) {
      throw new Error("funcCleanup.role is undefined");
    }
    bucket.grantRead(funcCleanup.role);
    bucket.grantDelete(funcCleanup.role);

    topic.addSubscription(new LambdaSubscription(funcCleanup));
    return funcCleanup;
  }

  private setUpCloudFront(bucket: Bucket, params: Params) {
    const code = readFileSync(path.join(__dirname, '../assets/basic_auth/function.js'))
      .toString()
      .replace(/__BASIC_AUTH_USER__/, params.basicAuthUser)
      .replace(/__BASIC_AUTH_PASSWORD__/, params.basicAuthPassword);

    // Use experimental.EdgeFunction from aws-cloudfront
    const fn = new experimental.EdgeFunction(this, 'basic-auth-func', {
      code: Code.fromInline(code),
      handler: "index.handler",
      runtime: Runtime.NODEJS_20_X,
      functionName: `radicaster-basic-auth${params.suffix}`,
      memorySize: 128,
    });

    const oai = new OriginAccessIdentity(this, 'oai');
    bucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["s3:GetObject"],
      principals: [
        new CanonicalUserPrincipal(oai.cloudFrontOriginAccessIdentityS3CanonicalUserId),
      ],
      resources: [bucket.bucketArn + "/*"],
    }));

    const domainNames = params.customDomain ? [params.customDomain] : undefined;
    const certificate = params.customDomainCertificateARN ? Certificate.fromCertificateArn(this, 'certificate', params.customDomainCertificateARN) : undefined;
    const dist = new Distribution(this, 'cloudfront', {
      certificate: certificate,
      domainNames: domainNames,
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessIdentity(bucket, {
          originAccessIdentity: oai,
        }),
        edgeLambdas: [
          {
            eventType: LambdaEdgeEventType.VIEWER_REQUEST,
            functionVersion: fn.currentVersion,
          }
        ],
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: new CachePolicy(this, 'cache-policy', {
          defaultTtl: Duration.minutes(1),
          maxTtl: Duration.minutes(1),
        })
      },
    });

    const domainName = domainNames ? domainNames[0] : dist.domainName
    new CfnOutput(this, `domainName`, {
      value: `https://${domainName}`,
      description: 'Root URL of Podcast feeds.'
    })

    return dist;
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
