module Radicaster::CLI
  describe S3 do
    describe "#save_definition" do
      let(:client) { instance_double(Aws::S3::Client) }
      let(:bucket) { "radicaster.test" }
      let(:def_) {
        instance_double(Definition,
                        program_id: "test",
                        to_yaml: "dummy yaml")
      }
      subject(:s3) { S3.new(client, bucket) }

      it "puts definition file to S3 bucket" do
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
