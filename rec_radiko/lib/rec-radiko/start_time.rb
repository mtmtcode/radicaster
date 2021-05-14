module Radicaster
  module RecRadiko
    class StartTime
      # 曜日指定から直近の録音日時を特定する
      def self.parse(today, s)
        m = s.downcase.gsub(":", "").match(/(sun|mon|tue|wed|thu|fri|sat) ([0-2][0-9])([0-5][0-9])([0-5][0-9])/)
        raise ArgumentError, "invalid format" unless m

        wday_s = m[1]
        hour = m[2]
        min = m[3]
        sec = m[4]
        wday = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].index(wday_s)

        wday_gap = today.wday - (wday <= today.wday ? wday : wday - 7)

        date = today - wday_gap
        time = Time.local(date.year, date.month, date.day, hour, min, sec)
        self.new(time)
      end

      def initialize(time)
        @time = time
      end

      def to_s()
        @time.strftime("%Y%m%d%H%M%S")
      end
    end
  end
end
