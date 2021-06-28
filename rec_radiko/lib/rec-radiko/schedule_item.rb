require "date"

module Radicaster
  module RecRadiko
    class ScheduleItem
      DAYS_OF_WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
      TIMEZONE_JP = "+09:00"

      def self.parse(s)
        m = s.chomp.downcase.match(/\A(sun|mon|tue|wed|thu|fri|sat) ([0-2]?[0-9]):([0-5]?[0-9])(:([0-5]?[0-9]))?\z/)
        raise ArgumentError, "invalid format" unless m

        wday = m[1]
        hour = m[2].to_i
        min = m[3].to_i
        sec = m[5] ? m[5].to_i : 0
        self.new(wday, hour, min, sec)
      end

      def initialize(wday, hour, min, sec)
        raise "wday is invalid" if DAYS_OF_WEEK.index(wday.downcase).nil?
        @wday = wday.downcase
        @hour = hour
        @min = min
        @sec = sec
      end

      def ==(other)
        return false unless other.is_a? ScheduleItem
        (wday.downcase == other.wday.downcase &&
         hour == other.hour &&
         min == other.min &&
         sec == other.sec)
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
