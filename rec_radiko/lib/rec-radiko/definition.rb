require "yaml"

module Radicaster
  module RecRadiko
    class Definition
      attr_reader :id, :area, :station, :program_schedule

      def self.parse(s)
        d = YAML.load(s)

        begin
          id = d.fetch("id")
          area = d.fetch("area")
          station = d.fetch("station")
          schedule = d.fetch("program_schedule")
        rescue KeyError => e
          raise ArgumentError, "requird key `#{e.key}` not found"
        end

        unless schedule.is_a?(Array)
          parsed_schedule = Schedule.new(ScheduleItem.parse(schedule))
        else
          parsed_items = schedule.map { |item|
            if item.is_a?(Array)
              elements = item.map { |elem| ScheduleItem.parse(elem) }
              CombinedScheduleItem.new(*elements)
            else
              ScheduleItem.parse(item)
            end
          }
          parsed_schedule = Schedule.new(*parsed_items)
        end

        Definition.new(id: id, area: area, station: station, program_schedule: parsed_schedule)
      end

      def initialize(id:, area:, station:, program_schedule:)
        @id = id
        @area = area
        @station = station
        @program_schedule = program_schedule
      end

      def ==(other)
        id == other.id && area == other.area && station == other.station && program_schedule == other.program_schedule
      end

      def latest_start_times(now)
        program_schedule.latest(now)
      end
    end
  end
end
