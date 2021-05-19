module Radicaster::GenFeed
  describe S3 do
    describe "#save" do
      let(:client) { double("client") }
      let(:bucket) { "dummy-bucket" }
      let(:prefix) { "dummy-prefix" }
      let(:feed_body) { "feed_body" }
      subject(:s3) { S3.new(client) }

      it "uploads passed body with proper key" do
        key = "dummy-prefix/index.rss"
        expect(client).to receive(:put_object).with(bucket: bucket, key: key, body: feed_body)
        s3.save(bucket, prefix, feed_body)
      end
    end
  end
end
