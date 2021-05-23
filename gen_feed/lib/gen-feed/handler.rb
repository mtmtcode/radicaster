require "erb"
require "pathname"

require "aws-sdk-s3"
require "yaml"

module Radicaster
  module GenFeed
    class GenerateFeedCommand
      attr_reader :program_id

      def initialize(program_id:)
        @program_id = program_id
      end
    end

    # CloudWatchのイベントをハンドルしてPodcastフィードを生成する
    class Handler
      def initialize(logger, region, bucket, storage, generator)
        @logger = logger
        @region = region
        @bucket = bucket
        @storage = storage
        @generator = generator
      end

      def handle(event:, context:)
        logger.info("Start event handling.")
        validate(event)
        cmd = build_cmd(event)
        exec(cmd)
        logger.info("Event handling finished.")
      end

      private

      attr_reader :logger, :region, :bucket, :storage, :generator

      def validate(event)
        raise '"s3" is not contained in the event' unless event["Records"][0]["s3"]
        region = event["Records"][0]["awsRegion"]
        bucket = event["Records"][0]["s3"]["bucket"]["name"]

        raise "unexpected region" if region != self.region
        raise "unexpected bucket" if bucket != self.bucket
      end

      def build_cmd(event)
        key = event["Records"][0]["s3"]["object"]["key"]
        logger.debug(key)
        program_id = Pathname.new(key).dirname.to_s
        GenerateFeedCommand.new(
          program_id: program_id,
        )
      end

      def exec(cmd)
        logger.debug("Start exec. program_id: #{cmd}")
        definition = storage.find_definition(cmd.program_id)
        episodes = storage.list_episodes(cmd.program_id)
        feed = generator.generate(definition, episodes)
        storage.save_feed(cmd.program_id, feed)
      end
    end
  end
end