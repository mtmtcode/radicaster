#!/usr/bin/env ruby

require "aws-sdk-s3"
require "aws-sdk-lambda"
require "aws-sdk-eventbridge"

require "cli/handler"
require "cli/definition"
require "cli/eventbridge"
require "cli/execution_schedule"
require "cli/lambda"
require "cli/s3"

module Radicaster
  module CLI
    def main(argv)
      bucket = ENV["RADICASTER_S3_BUCKET"] or raise "ENV['RADICASTER_S3_BUCKET'] must be set"
      s3_client = Aws::S3::Client.new
      storage = S3.new(s3_client, bucket)

      rec_radiko_arn = ENV["RADICASTER_REC_RADIKO_ARN"] or raise "ENV['RADICASTER_REC_RADIKO_ARN'] must be set"

      eb_client = Aws::EventBridge::Client.new
      scheduler = EventBridge.new(eb_client, rec_radiko_arn)

      lambda_client = Aws::Lambda::Client.new
      recorder = Lambda.new(lambda_client, rec_radiko_arn)

      h = Handler.new(storage, scheduler, recorder)
      h.handle(argv)
    end

    module_function :main
  end
end
