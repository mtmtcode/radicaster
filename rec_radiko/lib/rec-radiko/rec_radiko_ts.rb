module Radicaster
  module RecRadiko
    class RecRadikoTs
      DEFAULT_DURATION_MIN = 120

      def initialize(workdir, email = nil, password = nil)
        @workdir = workdir

        raise "email and password must be passed in together" if email.nil? ^ password.nil?
        @email = email
        @password = password
      end

      def rec(area, station, start_time)
        start_str = start_time.strftime("%Y%m%d%H%M%S")
        out_path = output_path(workdir, start_str, station)

        cmd = build_command(station, start_str, out_path)
        system(cmd, exception: true)

        out_path
      end

      private

      attr_reader :workdir, :email, :password

      def build_command(station, start_str, out_path)
        parts = ["rec_radiko_ts.sh"]
        parts << "-s #{station}"
        parts << "-f #{start_str}"
        parts << "-d #{DEFAULT_DURATION_MIN}"
        parts << "-o \"#{out_path}\""

        if !email.nil? && !password.nil?
          parts << "-m \"#{email}\""
          parts << "-p \"#{password}\""
        end

        parts.join(" ")
      end

      def output_path(workdir, start, station)
        "#{workdir}/#{start}-#{station}.m4a"
      end
    end
  end
end
