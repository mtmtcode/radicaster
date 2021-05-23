module Radicaster
  module RecRadiko
    class Radigo
      def initialize(workdir)
        @workdir = workdir
      end

      def rec(area, station_id, start)
        system("env RADIGO_HOME=/tmp radigo rec -area=#{area} -id=#{station_id} -s=#{start}", exception: true)
        "#{workdir}/#{start}-#{station_id}.aac"
      end

      private

      attr_reader :workdir
    end
  end
end
