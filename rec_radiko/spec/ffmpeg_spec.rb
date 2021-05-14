module Radicaster::RecRadiko
  describe Ffmpeg do
    describe "#concat" do
      let(:paths) {
        [
          "/path/to/1.aac",
          "/path/to/2.aac",
        ]
      }
      subject(:concater) { Ffmpeg.new() }
      it "concats passed files and returns result's path" do
        # NOTE: ffmpegでconcatっぽいことをしていればOK
        expect(concater).to receive(:system).with(/\Affmpeg.*\Wconcat\W/, exception: true)
        ret = concater.concat(paths)
        expect(ret).to eq("/path/to/1.m4a")
      end
    end
  end
end
