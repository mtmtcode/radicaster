module Radicaster::RecRadiko
  describe Radigo do
    let!(:workdir) { "/tmp" }
    subject(:radiko) { Radigo.new(workdir) }

    describe "#rec" do
      let(:area) { "JP13" }
      let(:id) { "TBS" }
      let(:start) { StartTime.new(Time.local(2020, 11, 22, 1, 0, 0)) }

      it "records a program using radigo" do
        expect(radiko).to receive(:system).with("env RADIGO_HOME=#{workdir} radigo rec -area=#{area} -id=#{id} -s=#{start}", exception: true)
        ret = radiko.rec(area, id, start)
        expect(ret).to eq("#{workdir}/#{start}-#{id}.aac")
      end
    end
  end
end
