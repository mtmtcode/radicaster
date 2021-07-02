require "aws-sdk-s3"

module Radicaster::GenFeed
  describe S3 do
    let(:client) { double("client") }
    let(:bucket) { "dummy-bucket" }
    let(:url) { "http://radicaster.test" }
    let(:id) { "dummy-program-id" }

    subject(:s3) { S3.new(client, bucket, url) }

    describe "#find_definition" do
      let(:def_body) do
        <<~EOS
          title: dummy-title
          author: dummy-author
          summary: dummy-summary
          image: http://foo.test/bar.png
        EOS
      end

      it "finds a defintion file according to passed prefix and returns a Definition object" do
        key = "#{id}/radicaster.yaml"
        resp = double("response", body: StringIO.new(def_body))
        expect(client).to receive(:get_object)
                            .with(bucket: bucket, key: key)
                            .and_return(resp)

        def_ = s3.find_definition(id)

        expect(def_.title).to eq("dummy-title")
        expect(def_.author).to eq("dummy-author")
        expect(def_.summary).to eq("dummy-summary")
        expect(def_.image).to eq("http://foo.test/bar.png")
      end
    end

    describe "#list_episodes" do
      it "search audio files from specified path and returns an array of Episode" do
        # mocking s3 response
        ep1_key = "#{id}/20210101.m4a"
        ep2_key = "#{id}/20210102.m4a"
        non_audio_key = "#{id}/20210101.txt"
        ep1_obj = instance_double(Aws::S3::Types::Object, "ep1", key: ep1_key, size: 100, last_modified: Time.now)
        ep2_obj = instance_double(Aws::S3::Types::Object, "ep2", key: ep2_key, size: 100, last_modified: Time.now)
        non_audio_obj = instance_double(Aws::S3::Types::Object, "non-audio", key: non_audio_key, size: 100, last_modified: Time.now)
        resp = instance_double(Aws::S3::Types::ListObjectsV2Output, "resp", {
          :contents => [
            ep1_obj,
            ep2_obj,
            non_audio_obj,
          ],
        })
        expect(client).to receive(:list_objects_v2).with(
                            bucket: bucket,
                            prefix: id + "/",
                          )
                            .and_return(resp)
        episodes = s3.list_episodes(id)
        expect(episodes.map(&:title)).to eq(["20210102.m4a", "20210101.m4a"])
      end
    end

    describe "#save_feed" do
      let(:feed_body) { "feed_body" }

      it "uploads passed body with proper key" do
        key = "dummy-program-id/index.rss"
        expect(client).to receive(:put_object).with(bucket: bucket, key: key, body: feed_body)
        s3.save_feed(id, feed_body)
      end
    end
  end
end
