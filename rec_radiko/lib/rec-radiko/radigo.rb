module Radicaster
  module RecRadiko
    class Radigo
      def initialize(workdir)
        @workdir = workdir
      end

      def rec(area, station, start)
        system("env RADIGO_HOME=/tmp radigo rec -area=#{area} -id=#{station} -s=#{start}", exception: true)
        "#{workdir}/#{start}-#{station}.aac"
      end

      private

      attr_reader :workdir
    end
  end
end
