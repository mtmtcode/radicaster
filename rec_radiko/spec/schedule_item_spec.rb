module Radicaster::RecRadiko
  describe ScheduleItem do
    describe ".parse" do
      subject { ScheduleItem.parse(input) }
      context "valid format" do
        where(:input) do
          [
            ["tue 01:02:03"],
            ["Tue 01:02:03"],
            ["TUE 01:02:03"],
            ["tue 1:2:3"],
          ]
        end

        let(:expected) { ScheduleItem.new("tue", 1, 2, 3) }
        with_them do
          it { is_expected.to eq(expected) }
        end
      end

      context "second can be omited" do
        let(:input) { "Tue 1:2" }
        it { is_expected.to eq(ScheduleItem.new("Tue", 1, 2, 0)) }
      end

      context "invalid format" do
        where(:input) do
          [
            ["aaa 01:00:00"],
            ["tue 30:00:00"],
            ["tue 01:60:00"],
            ["tue 01:00:60"],
          ]
        end

        with_them do
          it "raises a RuntimeError" do
            expect { ScheduleItem.parse(input) }.to raise_error(ArgumentError)
          end
        end
      end
    end

    describe "#==" do
      let(:this) { ScheduleItem.new("tue", 1, 0, 0) }
      where(:other, :expected) do
        [
          [ScheduleItem.new("tue", 1, 0, 0), true],
          [ScheduleItem.new("Tue", 1, 0, 0), true],
          [ScheduleItem.new("TUE", 1, 0, 0), true],
          [ScheduleItem.new("tue", 1, 0, 1), false],
          [ScheduleItem.new("tue", 1, 1, 0), false],
          [ScheduleItem.new("tue", 0, 0, 0), false],
          [ScheduleItem.new("mon", 0, 0, 0), false],
          [nil, false],
        ]
      end

      with_them do
        it "returns expected value" do
          expect(this == other).to eq(expected)
        end
      end
    end

    describe "#latest" do
      let(:now) { Time.new(2021, 6, 14, 12, 0, 0, "+09:00") }  # monday
      subject(:latest) { ScheduleItem.new(wday, hour, sec, min).latest(now) }

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
