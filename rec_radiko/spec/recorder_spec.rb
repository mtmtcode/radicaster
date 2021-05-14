require "date"

module Radicaster::RecRadiko
  describe Recorder do
    describe "#rec" do
      let!(:radiko) { double("radiko") }
      let!(:concater) { double("concater") }
      let!(:recorder) { Recorder.new(radiko, concater) }

      let(:area) { "JP13" }
      let(:id) { "TBS" }
      let(:starts) {
        [
          StartTime.new(Time.local(2020, 11, 22, 1, 0, 0)),
          StartTime.new(Time.local(2020, 11, 22, 2, 0, 0)),
        ]
      }

      it "record and concat multiple episodes" do
        recorded_paths = [
          "/path/to/1.aac",
          "/path/to/2.aac",
        ]
        concated_path = "/path/to/concated.m4a"
        expect(radiko).to receive(:rec).with(area, id, starts[0]).and_return(recorded_paths[0])
        expect(radiko).to receive(:rec).with(area, id, starts[1]).and_return(recorded_paths[1])
        expect(concater).to receive(:concat).with(recorded_paths).and_return(concated_path)

        expect(recorder.rec(area, id, starts)).to eq(concated_path)
      end
    end
  end
end
