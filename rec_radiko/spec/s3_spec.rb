module Radicaster::RecRadiko
  describe S3 do
    describe "#save" do
      let(:client) { double("client") }
      let(:bucket) { "dummy-bucket" }
      let(:program_id) { "dummy-program" }
      let(:start) { StartTime.new(Time.local(2021, 1, 1)) }
      let(:body) { StringIO.new("dummy\nstream") }

      subject(:s3) { S3.new(client, bucket) }
      it "uploads passed IO object to s3" do
        key = "dummy-program/20210101.m4a"
        expect(client).to receive(:put_object).with(bucket: bucket, key: key, body: body)
        s3.save(program_id, start, body)
      end
    end
  end
end
