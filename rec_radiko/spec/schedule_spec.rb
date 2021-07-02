module Radicaster::RecRadiko
  describe Schedule do
    describe "#==" do
      let(:this) {
        Schedule.new(
          CombinedScheduleItem.new(ScheduleItem.new("Mon", 8, 30, 0), ScheduleItem.new("Mon", 10, 0, 0)),
          ScheduleItem.new("Tue", 8, 30, 0),
        )
      }
      where(:other, :expected) do
        [
          [
            Schedule.new(
              CombinedScheduleItem.new(ScheduleItem.new("Mon", 8, 30, 0), ScheduleItem.new("Mon", 10, 0, 0)),
              ScheduleItem.new("Tue", 8, 30, 0),
            ), true,
          ],
          [nil, false],
          [Schedule.new(CombinedScheduleItem.new(ScheduleItem.new("Mon", 8, 30, 0))), false],
        ]
      end

      with_them do
        subject { this == other }
        it { is_expected.to eq(expected) }
      end
    end

    describe "#latest" do
      let(:now) { Time.new(2021, 6, 15, 0, 0, 0, "+09:00") }  # tuesday

      it "returns latest schedule item" do
        schedule = Schedule.new(
          CombinedScheduleItem.new(ScheduleItem.new("Mon", 8, 30, 0), ScheduleItem.new("Mon", 10, 0, 0)),
          ScheduleItem.new("Tue", 8, 30, 0),
          CombinedScheduleItem.new(ScheduleItem.new("Wed", 8, 30, 0), ScheduleItem.new("Wed", 10, 0, 0)),
          CombinedScheduleItem.new(ScheduleItem.new("Thu", 8, 30, 0), ScheduleItem.new("Thu", 10, 0, 0)),
          CombinedScheduleItem.new(ScheduleItem.new("Fri", 8, 30, 0), ScheduleItem.new("Fri", 10, 0, 0))
        )

        expected = [
          Time.new(2021, 6, 14, 8, 30, 0, "+09:00"),
          Time.new(2021, 6, 14, 10, 0, 0, "+09:00"),
        ]
        expect(schedule.latest(now)).to eq(expected)
      end
    end
  end
end
