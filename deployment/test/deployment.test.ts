import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as Radicaster from '../lib/radicaster-stack';

test.skip('Stack Created', () => {
  process.env.RADICASTER_S3_BUCKET = "test-bucket";
  process.env.RADICASTER_BASIC_AUTH_USER = "user";
  process.env.RADICASTER_BASIC_AUTH_PASSWORD = "password";

  const app = new cdk.App();
  // WHEN
  const stack = new Radicaster.RadicasterStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: "test-bucket"
  });
});
