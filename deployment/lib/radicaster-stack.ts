import { Certificate } from '@aws-cdk/aws-certificatemanager';
import { CachePolicy, Distribution, experimental, LambdaEdgeEventType, OriginAccessIdentity, ViewerProtocolPolicy } from '@aws-cdk/aws-cloudfront';
import { S3Origin } from '@aws-cdk/aws-cloudfront-origins';
import { CanonicalUserPrincipal, Effect, PolicyStatement, ServicePrincipal } from '@aws-cdk/aws-iam';
import { Code, DockerImageCode, DockerImageFunction, Runtime } from '@aws-cdk/aws-lambda';
import { S3EventSource } from '@aws-cdk/aws-lambda-event-sources';
import { Bucket, EventType } from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import { CfnOutput, Duration } from '@aws-cdk/core';
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
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
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

    const bucket = this.setUpS3Bucket(params);
    const dist = this.setUpCloudFront(bucket, params);
    this.setUpFuncRecRadiko(bucket, params);
    this.setUpFuncGenFeed(bucket, dist, params);
  }

  private setUpS3Bucket(params: Params) {
    return new Bucket(this, 'bucket', {
      bucketName: params.bucketName,
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
    bucket.grantRead(funcRecRadiko.role);
    bucket.grantPut(funcRecRadiko.role);

    new CfnOutput(this, `RecRadikoARN`, {
      value: funcRecRadiko.functionArn,
      description: 'ARN of rec-radiko function'
    });

    return funcRecRadiko;
  }

  private setUpFuncGenFeed(bucket: Bucket, dist: Distribution, params: Params) {
    const authPrefix = `${params.basicAuthUser}:${params.basicAuthPassword}@`
    const domainName = params.customDomain || dist.domainName;
    const funcGenFeed = new DockerImageFunction(this, `func-gen-feed`, {
      code: DockerImageCode.fromImageAsset(
        "../gen_feed"
      ),
      functionName: `radicaster-gen-feed${params.suffix}`,
      timeout: Duration.minutes(1),
      memorySize: 128,
      environment: {
        "RADICASTER_S3_BUCKET": params.bucketName,
        "RADICASTER_BUCKET_URL": `https://${authPrefix}${domainName}`,
      }
    });
    funcGenFeed.grantInvoke(new ServicePrincipal("events.amazonaws.com"));
    if (!funcGenFeed.role) {
      throw new Error("funcGenFeed.role is undefined");
    }
    bucket.grantRead(funcGenFeed.role);
    bucket.grantPut(funcGenFeed.role);

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

  private setUpCloudFront(bucket: Bucket, params: Params) {
    const code = readFileSync(path.join(__dirname, '../assets/basic_auth/function.js'))
      .toString()
      .replace(/__BASIC_AUTH_USER__/, params.basicAuthUser)
      .replace(/__BASIC_AUTH_PASSWORD__/, params.basicAuthPassword);
    const fn = new experimental.EdgeFunction(this, 'basic-auth-func', {
      code: Code.fromInline(code),
      handler: "index.handler",
      // NOTE: Node 14.x does not support inline code
      runtime: Runtime.NODEJS_12_X,
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
        origin: new S3Origin(bucket, {
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
