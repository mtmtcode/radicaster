require "date"

require "aws-sdk-s3"

module Radicaster
  module RecRadiko
    class RecCommand
      attr_reader :station_id, :program_id, :starts, :area

      def initialize(station_id:, program_id:, starts:, area:)
        @station_id = station_id
        @program_id = program_id
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
        raise "station_id must be set" unless event["station_id"]
        raise "program_id must be set" unless event["program_id"]
        raise "area must be set" unless event["area"]
        raise "start(s) must be set" unless event["start"] || event["startsa"]
      end

      def build_command(event)
        station_id = event["station_id"]
        program_id = event["program_id"]
        area = event["area"]
        starts = event["starts"]
        if !starts && event["start"]
          starts = [event["start"]]
        end

        today = Date.today
        parsed_starts = starts.map { |s| StartTime.parse(today, s) }

        RecCommand.new(
          station_id: station_id,
          program_id: program_id,
          area: area,
          starts: parsed_starts,
        )
      end

      def exec(cmd)
        logger.info("Start recording")
        local_path = recorder.rec(cmd.area, cmd.station_id, cmd.starts)
        logger.info("Finished recording")

        logger.info("Saving the episode to the storage")
        File.open(local_path, "rb") do |f|
          storage.save(cmd.program_id, cmd.starts[0], f)
        end
        logger.info("Finished saving the episode.")
      end
    end
  end
end
