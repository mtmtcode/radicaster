require "date"

require "aws-sdk-s3"

module Radicaster
  module RecRadiko
    class RecCommand
      attr_reader :station, :id, :starts, :area

      def initialize(station:, id:, starts:, area:)
        @station = station
        @id = id
        @starts = starts
        @area = area
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
        raise "station must be set" unless event["station"]
        raise "id must be set" unless event["id"]
        raise "area must be set" unless event["area"]
        raise "start(s) must be set" unless event["start"] || event["startsa"]
      end

      def build_command(event)
        station = event["station"]
        id = event["id"]
        area = event["area"]
        starts = event["starts"]
        if !starts && event["start"]
          starts = [event["start"]]
        end

        today = Date.today
        parsed_starts = starts.map { |s| StartTime.parse(today, s) }

        RecCommand.new(
          station: station,
          id: id,
          area: area,
          starts: parsed_starts,
        )
      end

      def exec(cmd)
        logger.info("Start recording")
        local_path = recorder.rec(cmd.area, cmd.station, cmd.starts)
        logger.info("Finished recording")

        logger.info("Saving the episode to the storage")
        File.open(local_path, "rb") do |f|
          storage.save(cmd.id, cmd.starts[0], f)
        end
        logger.info("Finished saving the episode.")
      end
    end
  end
end
