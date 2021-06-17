module Radicaster::RecRadiko
  describe Definition do
    describe ".parse" do
    end

    describe "#==" do
      let!(:this) do
        Definition.new(
          id: "test",
          area: "JP13",
          station: "TEST",
          starts: [
            [ScheduleTime.new("Mon", 8, 30, 0)],
            [ScheduleTime.new("Tue", 8, 30, 0)],
          ],
        )
      end

      where(:id, :area, :station, :starts, :expected) do
        [
          ["test", "JP13", "TEST", [[ScheduleTime.new("Mon", 8, 30, 0)], [ScheduleTime.new("Tue", 8, 30, 0)]], true],
          ["testX", "JP13", "TEST", [[ScheduleTime.new("Mon", 8, 30, 0)], [ScheduleTime.new("Tue", 8, 30, 0)]], false],
          ["test", "JP13X", "TEST", [[ScheduleTime.new("Mon", 8, 30, 0)], [ScheduleTime.new("Tue", 8, 30, 0)]], false],
          ["test", "JP13", "TESTX", [[ScheduleTime.new("Mon", 8, 30, 0)], [ScheduleTime.new("Tue", 8, 30, 0)]], false],
          ["test", "JP13", "TEST", [[ScheduleTime.new("Mon", 8, 30, 1)], [ScheduleTime.new("Tue", 8, 30, 0)]], false],
        ]
      end

      let(:other) { Definition.new(id: id, area: area, station: station, starts: starts) }
      subject { this == other }

      with_them do
        it { is_expected.to eq expected }
      end
    end
  end
end
