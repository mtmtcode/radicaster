module Radicaster::CLI
  describe S3 do
    describe "#save_definition" do
      let(:client) { instance_double(Aws::S3::Client) }
      let(:bucket) { "radicaster.test" }
      let(:def_) {
        Definition.new(
          id: "test",
          title: "test title",
          author: "test author",
          image: "http://radicaster.test/example.png",
          program_starts: [
            Schedule.new(wday: "Tue", hour: 1, min: 0),
            Schedule.new(wday: "Tue", hour: 2, min: 0),
          ],
          rec_start: Schedule.new(wday: "Tue", hour: 3, min: 3),
          station: "TBS",
          area: "JP13",
        )
      }
      subject(:s3) { S3.new(client, bucket) }

      it "puts definition file to S3 bucket" do
        allow(def_).to receive(:to_yaml).and_return("test yaml")
        expect(client).to receive(:put_object).with(
          satisfy do |arg|
            arg[:bucket] == "radicaster.test" &&
            arg[:key] == "test/radicaster.yaml" &&
            arg[:body].read == "test yaml"
          end
        )
        s3.save_definition(def_)
      end
    end
  end
end
