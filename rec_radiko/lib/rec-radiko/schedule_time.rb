require "date"

module Radicaster
  module RecRadiko
    class ScheduleTime
      DAYS_OF_WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
      TIMEZONE_JP = "+09:00"

      def initialize(wday, hour, min, sec)
        # TODO normalize
        @wday = wday
        @hour = hour
        @min = min
        @sec = sec
      end

      def latest(now)
        day_gap = now.wday - wday_index
        latest_date = now.to_date - day_gap
        latest_time = Time.new(latest_date.year, latest_date.month, latest_date.day, hour, min, sec, TIMEZONE_JP)
        latest_time <= now ? latest_time : latest_time - (7 * 24 * 60 * 60)
      end

      attr_reader :wday, :hour, :min, :sec

      private

      def wday_index()
        DAYS_OF_WEEK.index(wday.downcase)
      end
    end
  end
end
