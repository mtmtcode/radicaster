module Radicaster
  module RecRadiko
    class Recorder
      def initialize(radiko, concater)
        @radiko = radiko
        @concater = concater
      end

      def rec(area, id, starts)
        paths = starts.map { |start| radiko.rec(area, id, start) }
        concater.concat(paths)
      end

      private

      attr_reader :radiko, :concater
    end
  end
end
