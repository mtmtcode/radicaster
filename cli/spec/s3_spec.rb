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
      let(:bucket) { "radicaster.test" }
      subject(:s3) { S3.new(client, bucket) }
      it "puts definition file to S3 bucket" do
        allow(def_).to receive(:to_yaml).and_return("dummy yaml")
        expect(client).to receive(:put_object).with(
          satisfy do |arg|
            arg[:bucket] == "radicaster.test" &&
            arg[:key] == "test/radicaster.yaml" &&
            arg[:body].read == "dummy yaml"
          end
        )
        s3.save_definition(def_)
      end
    end
  end
end
