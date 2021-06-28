require "date"

require "aws-sdk-s3"

module Radicaster
  module RecRadiko
    class RecCommand
      attr_reader :id

      def initialize(id:)
        @id = id
      end
    end

    # CloudWatchのイベントをハンドルしてradikoを録音する
    class Handler
      def initialize(logger, recorder, storage)
        @logger = logger
        @recorder = recorder
        @storage = storage
      end

      def handle(event:, context:)
        logger.debug(event)
        validate(event)
        cmd = build_command(event)
        exec(cmd)
      end

      private

      attr_reader :logger, :recorder, :storage

      def validate(event)
        raise "id must be set" unless event["id"]
      end

      def build_command(event)
        id = event["id"]
        RecCommand.new(
          id: id,
        )
      end

      def exec(cmd)
        def_ = storage.find_definition(cmd.id)
        logger.info("Definition #{cmd.id} found")

        logger.info("Starting recording")
        episode = recorder.rec(def_, Time.now)
        logger.info("Recording finished")

        logger.info("Saving the episode to storage")
        storage.save_episode(episode)
        logger.info("Finished saving the episode.")
      end
    end
  end
end
