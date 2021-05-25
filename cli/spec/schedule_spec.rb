module Radicaster::CLI
  describe Schedule do
    describe "parse" do
      context "normal cases" do
        where(:s, :wday, :hour, :min) do
          [
            ["Sun 01:02:03", "Sun", 1, 2],
            ["Sun 1:2:3", "Sun", 1, 2],
            ["SUN 01:02:03", "Sun", 1, 2],
          ]
        end
        subject(:schedule) { Schedule.parse(s) }

        with_them do
          it "returns parsed Schedule" do
            expect(schedule.wday).to eq(wday)
            expect(schedule.hour).to eq(hour)
            expect(schedule.min).to eq(min)
          end
        end
      end

      context "abnormal cases" do
        where(:s) do
          [
            ["San 01:02:03"],
            ["Sun 010203"],
          ]
        end
        subject(:schedule) { Schedule.parse(s) }

        with_them do
          it "raises an RuntimeError" do
            expect { Schedule.parse(s) }.to raise_error(RuntimeError)
          end
        end
      end
    end

    describe "#cron" do
      where(:wday, :hour, :min, :cron) do
        [
          ["Sun", 9, 0, "cron(0 0 ? * Sun *)"],
          ["Sun", 8, 59, "cron(59 23 ? * Sat *)"],
        ]
      end

      with_them do
        subject { Schedule.new(wday: wday, hour: hour, min: min).cron }
        it { is_expected.to eq(cron) }
      end
    end

    describe "#to_s" do
      subject { Schedule.new(wday: "Tue", hour: 1, min: 2).to_s }
      it { is_expected.to eq("Tue 01:02:00") }
    end
  end
end
