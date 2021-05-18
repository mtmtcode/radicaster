module Radicaster
  module RecRadiko
    class Radigo
      def initialize(workdir)
        @workdir = workdir
      end

      def rec(area, id, start)
        system("env RADIGO_HOME=/tmp radigo rec -area=#{area} -id=#{id} -s=#{start}", exception: true)
        "#{workdir}/#{start}-#{id}.aac"
      end

      private

      attr_reader :workdir
    end
  end
end
