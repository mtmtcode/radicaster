#!/usr/bin/env ruby

require "aws-sdk-s3"
require "aws-sdk-eventbridge"

require "cli/handler"
require "cli/definition"
require "cli/execution_schedule"
require "cli/s3"
require "cli/eventbridge"

module Radicaster
  module CLI
    def main(argv)
      bucket = ENV["RADICASTER_S3_BUCKET"] or raise "ENV['RADICASTER_S3_BUCKET'] must be set"
      s3_client = Aws::S3::Client.new
      storage = S3.new(s3_client, bucket)

      rec_radiko_arn = ENV["RADICASTER_REC_RADIKO_ARN"] or raise "ENV['RADICASTER_REC_RADIKO_ARN'] must be set"
      eb_client = Aws::EventBridge::Client.new
      scheduler = EventBridge.new(eb_client, rec_radiko_arn)

      h = Handler.new(storage, scheduler)
      h.handle(argv)
    end

    module_function :main
  end
end
