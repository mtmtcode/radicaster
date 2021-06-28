require "date"

module Radicaster::RecRadiko
  describe Recorder do
    describe "#rec" do
      let(:radiko) { double("radiko") }
      let(:concater) { double("concater") }
      let(:recorder) { Recorder.new(radiko, concater) }

      let(:id) { "test" }
      let(:area) { "JP13" }
      let(:station) { "TEST" }

      let(:def_) {
        Definition.new(
          id: id,
          area: area,
          station: station,
          program_schedule: schedule,
        )
      }
      let(:now) { Time.new(2021, 6, 23, 0, 0, 0, "+09:00") }  # wednesday

      context "simple schdule program" do
        let(:schedule) {
          Schedule.new(
            ScheduleItem.new("Tue", 1, 0, 0)
          )
        }

        it "record and concat multiple episodes" do
          recorded_paths = [
            "/path/to/1.aac",
          ]
          expect(radiko).to receive(:rec).with("JP13", "TEST", Time.new(2021, 6, 22, 1, 0, 0, "+09:00")).and_return(recorded_paths[0])
          expect(concater).to receive(:concat).with(recorded_paths).and_return("/path/to/concated.m4a")

          episode = recorder.rec(def_, now)
          expect(episode).to eq(
            Episode.new(
              id: "test",
              station: "TEST",
              start_time: Time.new(2021, 6, 22, 1, 0, 0, "+09:00"),
              local_path: "/path/to/concated.m4a",
            )
          )
        end
      end

      context "combined schdule program" do
        let(:schedule) {
          Schedule.new(
            CombinedScheduleItem.new(
              ScheduleItem.new("Tue", 1, 0, 0),
              ScheduleItem.new("Tue", 2, 0, 0)
            )
          )
        }

        it "record and concat multiple episodes" do
          recorded_paths = [
            "/path/to/1.aac",
            "/path/to/2.aac",
          ]
          expect(radiko).to receive(:rec).with("JP13", "TEST", Time.new(2021, 6, 22, 1, 0, 0, "+09:00")).and_return(recorded_paths[0])
          expect(radiko).to receive(:rec).with("JP13", "TEST", Time.new(2021, 6, 22, 2, 0, 0, "+09:00")).and_return(recorded_paths[1])
          expect(concater).to receive(:concat).with(recorded_paths).and_return("/path/to/concated.m4a")

          episode = recorder.rec(def_, now)
          expect(episode).to eq(
            Episode.new(
              id: "test",
              station: "TEST",
              start_time: Time.new(2021, 6, 22, 1, 0, 0, "+09:00"),
              local_path: "/path/to/concated.m4a",
            )
          )
        end
      end
    end
  end
end
