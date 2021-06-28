module Radicaster
  module RecRadiko
    class Radigo
      def initialize(workdir, email = nil, password = nil)
        @workdir = workdir

        raise "email and password must be passed in together" if email.nil? ^ password.nil?
        @email = email
        @password = password
      end

      def rec(area, station, start_time)
        env = ["RADIGO_HOME=#{workdir}"]
        if !email.nil? && !password.nil?
          env.push("RADIKO_MAIL=#{email}", "RADIKO_PASSWORD=#{password}")
        end
        start_str = start_time.strftime("%Y%m%d%H%M%S")
        system("rm -f #{output_path(workdir, start_str, station)}")
        system("env #{env.join(" ")} radigo rec -area=#{area} -id=#{station} -s=#{start_str}", exception: true)
        output_path(workdir, start_str, station)
      end

      private

      def output_path(workdir, start, station)
        "#{workdir}/#{start}-#{station}.aac"
      end

      attr_reader :workdir, :email, :password
    end
  end
end
