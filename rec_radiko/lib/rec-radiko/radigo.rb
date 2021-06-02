module Radicaster
  module RecRadiko
    class Radigo
      def initialize(workdir, email = nil, password = nil)
        @workdir = workdir

        raise "email and password must be passed in together" if email.nil? ^ password.nil?
        @email = email
        @password = password
      end

      def rec(area, station, start)
        env = ["RADIGO_HOME=#{workdir}"]
        if !email.nil? && !password.nil?
          env.push("RADIKO_MAIL=#{email}", "RADIKO_PASSWORD=#{password}")
        end

        system("rm -f #{output_path(workdir, start, station)}")
        system("env #{env.join(" ")} radigo rec -area=#{area} -id=#{station} -s=#{start}", exception: true)
        output_path(workdir, start, station)
      end

      private

      def output_path(workdir, start, station)
        "#{workdir}/#{start}-#{station}.aac"
      end

      attr_reader :workdir, :email, :password
    end
  end
end
