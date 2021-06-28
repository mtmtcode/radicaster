require "tempfile"

module Radicaster::RecRadiko
  describe S3 do
    let(:client) { instance_double(Aws::S3::Client, "client") }
    let(:bucket) { "dummy-bucket" }
    let(:s3) { S3.new(client, bucket) }
    let(:id) { "test" }

    describe "#find_definition" do
      let(:def_body) do
        <<~EOS
          id: test
          area: JP13
          station: TEST
          title: dummy-title
          author: dummy-author
          summary: dummy-summary
          image: http://foo.test/bar.png
          program_schedule: Tue 01:00:00
        EOS
      end

      it "finds a defintion file by id and returns a Definition object" do
        resp = instance_double(Aws::S3::Types::GetObjectOutput, "resp", body: StringIO.new(def_body))
        expect(client).to receive(:get_object)
                            .with(bucket: bucket, key: "test/radicaster.yaml")
                            .and_return(resp)
        expect(s3.find_definition(id)).to eq(Definition.new(
          id: "test",
          area: "JP13",
          station: "TEST",
          program_schedule: Schedule.new(ScheduleItem.new("Tue", 1, 0, 0)),
        ))
      end
    end

    describe "#save_episode" do
      let(:episode) {
        Episode.new(
          id: "test",
          station: "TEST",
          start_time: Time.new(2021, 6, 22, 1, 0, 0, "+09:00"),
          local_path: Tempfile.new.path,
        )
      }
      it "uploads episode to s3" do
        expect(client).to receive(:put_object).with(hash_including(
          bucket: bucket,
          key: "test/20210622.m4a",
        ))
        s3.save_episode(episode)
      end
    end
  end
end
