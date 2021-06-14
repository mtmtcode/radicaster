module Radicaster::RecRadiko
  describe ScheduleTime do
    describe "#latest" do
      let(:now) { Time.new(2021, 6, 14, 12, 0, 0, "+09:00") }  # monday
      subject(:latest) { ScheduleTime.new(wday, hour, sec, min).latest(now) }

      where(:wday, :hour, :sec, :min, :expected) do
        [
          ["Sun", 12, 0, 0, Time.new(2021, 6, 13, 12, 0, 0, "+09:00")],
          ["Mon", 11, 59, 59, Time.new(2021, 6, 14, 11, 59, 59, "+09:00")],
          ["Mon", 12, 0, 0, Time.new(2021, 6, 14, 12, 0, 0, "+09:00")],
          ["Mon", 12, 0, 1, Time.new(2021, 6, 7, 12, 0, 1, "+09:00")],
          ["Tue", 0, 0, 0, Time.new(2021, 6, 8, 0, 0, 0, "+09:00")],
        ]
      end

      with_them do
        it "returns latest scheduled time" do
          expect(latest).to eq(expected)
        end
      end
    end
  end
end
