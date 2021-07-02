module Radicaster::CLI
  describe ExecutionSchedule do
    describe ".parse" do
      context "normal cases" do
        where(:s, :expected) do
          [
            ["Tue 08:05:00", ExecutionSchedule.new("Tue", 8, 5)],
            ["tue 08:05:00", ExecutionSchedule.new("Tue", 8, 5)],
            ["Tue 8:5", ExecutionSchedule.new("Tue", 8, 5)],
          ]
        end
        subject { ExecutionSchedule.parse(s) }

        with_them do
          it { is_expected.to eq(expected) }
        end
      end

      context "abnormal cases" do
        where(:s) do
          [
            ["Tue 0805"],
            ["Hoge 08:30:00"],
            ["Hoge 25:30:00"],
          ]
        end
        with_them do
          it { expect { ExecutionSchedule.parse(s) }.to raise_error(ArgumentError) }
        end
      end
    end

    describe "#to_cron" do
      where(:wday, :hour, :min, :cron) do
        [
          ["Sun", 9, 0, "cron(0 0 ? * Sun *)"],
          ["Sun", 8, 59, "cron(59 23 ? * Sat *)"],
        ]
      end

      with_them do
        subject { ExecutionSchedule.new(wday, hour, min).to_cron }
        it { is_expected.to eq(cron) }
      end
    end

    describe "#to_yaml" do
      subject { ExecutionSchedule.new("Tue", 1, 2).to_yaml }
      it { is_expected.to eq("Tue 01:02:00") }
    end

    describe "#==" do
      let(:this) { ExecutionSchedule.new("Tue", 12, 0) }

      where(:wday, :hour, :min, :expected) do
        [
          ["Tue", 12, 0, true],
          ["tue", 12, 0, true],
          ["Mon", 12, 0, false],
          ["Tue", 13, 0, false],
          ["Tue", 12, 1, false],
        ]
      end

      let(:other) { ExecutionSchedule.new(wday, hour, min) }
      subject { this == other }

      with_them do
        it { is_expected.to eq expected }
      end
    end
  end
end
