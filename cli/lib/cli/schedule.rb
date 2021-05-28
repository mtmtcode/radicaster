class Schedule
  DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  attr_reader :wday, :hour, :min

  def self.parse(s)
    m = /\A(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s*([0-5]?[0-9]):([0-5]?[0-9])(?::([0-5]?[0-9]))?\z/i.match(s)
    raise "スケジュールの書式が不正です" if m == nil

    # TODO 曜日が複数ある場合の考慮
    wday = m[1].downcase.capitalize
    hour = m[2].to_i
    min = m[3].to_i
    # secは不要

    self.new(wday: wday, hour: hour, min: min)
  end

  def initialize(wday:, hour:, min:)
    @wday = wday
    @hour = hour
    @min = min
  end

  def cron
    jst_wday = DAYS_OF_WEEK.index(@wday)
    jst_hour = @hour
    # タイムゾーンをJSTからUTCに変換
    if jst_hour >= 9
      utc_wday = jst_wday
      utc_hour = jst_hour - 9
    else
      utc_wday = (jst_wday == 0 ? 6 : jst_wday - 1)
      utc_hour = 24 + jst_hour - 9
    end
    "cron(#{@min} #{utc_hour} ? * #{DAYS_OF_WEEK[utc_wday]} *)"
  end

  def to_s()
    hour_pad = "%#02d" % @hour
    min_pad = "%#02d" % @min
    "#{@wday} #{hour_pad}:#{min_pad}:00"
  end

  def to_yaml()
    to_s
  end
end
