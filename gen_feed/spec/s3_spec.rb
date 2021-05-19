module Radicaster::GenFeed
  describe S3 do
    let(:client) { double("client") }
    let(:bucket) { "dummy-bucket" }
    let(:prefix) { "dummy-prefix" }
    subject(:s3) { S3.new(client) }

    describe "#find_definition" do
      let(:def_body) do
        <<-EOS
        title: dummy-title
        author: dummy-author
        summary: dummy-summary
        image: http://foo.test/bar.png
        EOS
      end

      it "finds a defintion file according to passed prefix and returns a Definition object" do
        key = "dummy-prefix/radicaster.yaml"
        resp = double("response", body: StringIO.new(def_body))
        expect(client).to receive(:get_object)
                            .with(bucket: bucket, key: key)
                            .and_return(resp)

        def_ = s3.find_definition(bucket, prefix)

        expect(def_.title).to eq("dummy-title")
        expect(def_.author).to eq("dummy-author")
        expect(def_.summary).to eq("dummy-summary")
        expect(def_.image).to eq("http://foo.test/bar.png")
      end
    end

    describe "#save" do
      let(:feed_body) { "feed_body" }

      it "uploads passed body with proper key" do
        key = "dummy-prefix/index.rss"
        expect(client).to receive(:put_object).with(bucket: bucket, key: key, body: feed_body)
        s3.save(bucket, prefix, feed_body)
      end
    end
  end
end
