module Radicaster
  module RecRadiko
    class Definition
      attr_reader :id, :area, :station, :starts

      def self.parse(s)
        # TODO YAMLをパースする
      end

      def initialize(id:, area:, station:, starts:)
        @id = id
        @area = area
        @station = station
        @starts = starts
      end

      def ==(other)
        id == other.id && area == other.area && station == other.station && starts == other.starts
      end
    end
  end
end
