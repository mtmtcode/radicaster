module Radicaster
  module RecRadiko
    class Recorder
      def initialize(radiko, concater)
        @radiko = radiko
        @concater = concater
      end

      def rec(area, station, starts)
        paths = starts.map { |start| radiko.rec(area, station, start) }
        concater.concat(paths)
      end

      private

      attr_reader :radiko, :concater
    end
  end
end
