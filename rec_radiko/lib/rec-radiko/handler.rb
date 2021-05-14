require "date"

require "aws-sdk-s3"

module Radicaster
  module RecRadiko

    # CloudWatchのイベントをハンドルしてradikoを録音する
    class Handler
      def initialize(logger, recorder, storage)
        @logger = logger
        @recorder = recorder
        @storage = storage
      end

      def handle(event:, context:)
        logger.debug(event)
        # TODO バリデーション
        cmd = gen_command(event)
        exec(cmd)
      end

      private

      attr_reader :logger, :recorder, :storage

      def gen_command(event)
        id = event["id"]
        starts = event["starts"]
        if !starts && event["start"]
          starts = [event["start"]]
        end
        bucket = event["bucket"]
        upload_prefix = event["upload_prefix"]
        area = event["area"]

        now = Time.new()
        parsed_starts = starts.map { |s| StartTime.parse(now, s) }

        RecCommand.new(
          id: id,
          starts: parsed_starts,
          area: area,
          bucket: bucket,
          upload_prefix: upload_prefix,
        )
      end

      def exec(cmd)
        logger.info("Start recording")
        local_path = recorder.rec(cmd.area, cmd.id, cmd.starts)
        logger.info("Finished recording")

        logger.info("Saving the episode to the storage")
        upload_key = make_upload_path(cmd.upload_prefix, cmd.starts[0])
        File.open(local_path, "rb") do |f|
          storage.save(cmd.bucket, upload_key, f)
        end
        logger.info("Finished saving the episode")
      end

      def make_upload_path(prefix, start)
        yyyymmdd = start[0..7]
        "#{prefix}#{yyyymmdd}.m4a"
      end
    end

    class RecCommand
      attr_reader :id, :starts, :bucket, :upload_prefix, :area

      def initialize(id:, starts:, area:, bucket:, upload_prefix:)
        @id = id
        @starts = starts
        @area = area
        @bucket = bucket
        @upload_prefix = upload_prefix
      end
    end
  end
end
