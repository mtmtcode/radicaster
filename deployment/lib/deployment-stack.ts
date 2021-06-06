import { Certificate } from '@aws-cdk/aws-certificatemanager';
import { Distribution, experimental, LambdaEdgeEventType, OriginAccessIdentity, ViewerProtocolPolicy } from '@aws-cdk/aws-cloudfront';
import { S3Origin } from '@aws-cdk/aws-cloudfront-origins';
import { ServicePrincipal } from '@aws-cdk/aws-iam';
import { Code, DockerImageCode, DockerImageFunction, Runtime } from '@aws-cdk/aws-lambda';
import { S3EventSource } from '@aws-cdk/aws-lambda-event-sources';
import { Bucket, EventType } from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import { Duration } from '@aws-cdk/core';
import * as path from 'path';

interface Params {
  suffix: string;
  bucketName: string;
  customDomain?: string;
  customDomainCertificateARN?: string
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
      websiteIndexDocument: 'index.rss',
      publicReadAccess: false,
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

  private setUpFuncGenFeed(bucket: Bucket, dist: Distribution, params: Params) {
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
        "RADICASTER_BUCKET_URL": `https://${domainName}`,
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

  private setUpCloudFront(bucket: Bucket, params: Params) {
    const fn = new experimental.EdgeFunction(this, 'basic-auth-func', {
      code: Code.fromAsset(path.join(__dirname, '../assets/basic_auth')),
      handler: "function.handler",
      runtime: Runtime.NODEJS_14_X,
      functionName: `radicaster-basic-auth${params.suffix}`,
      memorySize: 128,
    });

    const oai = new OriginAccessIdentity(this, 'oai', {});

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
      },
    });
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
