module Radicaster
  module RecRadiko
    class Recorder
      def initialize(radiko, concater)
        @radiko = radiko
        @concater = concater
      end

      def rec(def_, now)
        start_times = def_.latest_start_times(now)
        paths = start_times.map { |st| radiko.rec(def_.area, def_.station, st) }
        concated_path = concater.concat(paths)

        Episode.new(
          id: def_.id,
          station: def_.station,
          start_time: start_times[0],
          local_path: concated_path,
        )
      end

      private

      attr_reader :radiko, :concater
    end
  end
end
