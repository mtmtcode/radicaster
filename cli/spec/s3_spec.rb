module Radicaster::CLI
  describe S3 do
    describe "#save_definition" do
      let(:def_) {
        Definition.new(
          program_id: "test",
          title: "test title",
          author: "test author",
          image: "http://radicaster.test/example.png",
          program_starts: [
            Schedule.new(wday: "Tue", hour: 1, min: 0),
            Schedule.new(wday: "Tue", hour: 2, min: 0),
          ],
          rec_start: Schedule.new(wday: "Tue", hour: 3, min: 3),
          station_id: "TBS",
          area: "JP13",
        )
      }
      let(:client) { instance_double(Aws::S3::Client) }
      subject(:s3) { S3.new(client) }
      it "puts definition file to S3 bucket" do
        expect(client).to receive(:put_object)
        s3.save_definition(def_)
      end
    end
  end
end
