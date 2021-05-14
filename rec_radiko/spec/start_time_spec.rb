require "date"

module Radicaster::RecRadiko
  describe StartTime do
    describe "#parse" do
      let(:now) { Date.new(2021, 4, 21) }  # wednesday

      context "normal cases" do
        before do
          allow(StartTime).to receive(:new)
        end

        context "valid format" do
          where(:s) do
            [
              ["Mon 01:02:03"],
              ["mon 01:02:03"],
            ]
          end

          with_them do
            it "calls the method `new` with the passed argument" do
              StartTime.parse(now, s)
              expect(StartTime).to have_received(:new).with(Time.local(2021, 4, 19, 1, 2, 3))
            end
          end
        end

        context "if the wday is the same as today" do
          let(:s) { "Wed 01:02:03" }
          it "recognizes the day as today" do
            StartTime.parse(now, s)
            expect(StartTime).to have_received(:new).with(Time.local(2021, 4, 21, 1, 2, 3))
          end
        end

        context "if the wday is larger than today" do
          let(:s) { "Thu 01:02:03" }
          it "recognizes the day as the last wday" do
            StartTime.parse(now, s)
            expect(StartTime).to have_received(:new).with(Time.local(2021, 4, 15, 1, 2, 3))
          end
        end
      end

      context "abnormal cases" do
        context "invalid format" do
          subject { -> { StartTime.parse(now, s) } }
          where(:s) do
            [
              ["Tu 01:02:03"],
              ["Mon 1:2:3"],
            ]
          end

          with_them do
            it "raises ArguemntError" do
              expect { StartTime.parse(now, s) }.to raise_error(ArgumentError, "invalid format")
            end
          end
        end
      end
    end
  end
end
