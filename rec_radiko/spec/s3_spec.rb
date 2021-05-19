module Radicaster::RecRadiko
  describe S3 do
    describe "#save" do
      let(:client) { double("client") }
      let(:bucket) { "dummy-bucket" }
      let(:key) { "key" }
      let(:body) { StringIO.new("dummy\nstream") }

      subject(:s3) { S3.new(client) }
      it "upload passed IO object to s3" do
        expect(client).to receive(:put_object).with(bucket: bucket, key: key, body: body)
        s3.save(bucket, key, body)
      end
    end
  end
end
