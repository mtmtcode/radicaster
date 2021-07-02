module Radicaster
  module CLI
    class ExecutionSchedule
      DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

      attr_reader :wday, :hour, :min

      def self.parse(s)
        m = /\A(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s*([0-5]?[0-9]):([0-5]?[0-9])(?::([0-5]?[0-9]))?\z/i.match(s)
        raise ArgumentError, "execution schedule format is invalid" if m == nil

        wday = m[1].downcase.capitalize
        hour = m[2].to_i
        min = m[3].to_i
        # secは不要

        self.new(wday, hour, min)
      end

      def initialize(wday, hour, min)
        @wday = wday.capitalize
        @hour = hour
        @min = min
      end

      def to_cron()
        jst_wday = DAYS_OF_WEEK.index(wday)
        jst_hour = hour
        # タイムゾーンをJSTからUTCに変換
        if jst_hour >= 9
          utc_wday = jst_wday
          utc_hour = jst_hour - 9
        else
          utc_wday = (jst_wday == 0 ? 6 : jst_wday - 1)
          utc_hour = 24 + jst_hour - 9
        end
        "cron(#{min} #{utc_hour} ? * #{DAYS_OF_WEEK[utc_wday]} *)"
      end

      def to_yaml()
        hour_pad = "%#02d" % hour
        min_pad = "%#02d" % min
        "#{wday} #{hour_pad}:#{min_pad}:00"
      end

      def ==(other)
        other.is_a?(self.class) && wday == other.wday && hour == other.hour && min == other.min
      end
    end
  end
end
