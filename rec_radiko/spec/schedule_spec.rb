module Radicaster::RecRadiko
  describe Schedule do
    describe "#==" do
      let(:this) {
        Schedule.new([
          [ScheduleTime.new("Mon", 8, 30, 0), ScheduleTime.new("Mon", 10, 0, 0)],
          [ScheduleTime.new("Tue", 8, 30, 0), ScheduleTime.new("Tue", 10, 0, 0)],
        ])
      }
      where(:other, :expected) do
        [
          [nil, false],
          [Schedule.new([[ScheduleTime.new("Mon", 8, 30, 0)]]), false],
          [Schedule.new([
            [ScheduleTime.new("Mon", 8, 30, 0)],
            [ScheduleTime.new("Mon", 10, 0, 0)],
          ]), false],
        ]
      end

      with_them do
        it "returns expected value" do
          expect(this == other).to eq(expected)
        end
      end
    end

    describe "#latest" do
      let(:now) { Time.new(2021, 6, 15, 0, 0, 0, "+09:00") }  # tuesday

      it "returns latest schedule item" do
        items = [
          [ScheduleTime.new("Mon", 8, 30, 0), ScheduleTime.new("Mon", 10, 0, 0)],
          [ScheduleTime.new("Tue", 8, 30, 0), ScheduleTime.new("Tue", 10, 0, 0)],
          [ScheduleTime.new("Wed", 8, 30, 0), ScheduleTime.new("Wed", 10, 0, 0)],
          [ScheduleTime.new("Thu", 8, 30, 0), ScheduleTime.new("Thu", 10, 0, 0)],
          [ScheduleTime.new("Fri", 8, 30, 0), ScheduleTime.new("Fri", 10, 0, 0)],
        ]
        schedule = Schedule.new(items)

        expected = [
          Time.new(2021, 6, 14, 8, 30, 0, "+09:00"),
          Time.new(2021, 6, 14, 10, 0, 0, "+09:00"),
        ]
        expect(schedule.latest(now)).to eq(expected)
      end
    end
  end
end
