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

    xdescribe "#save_episode" do
      let(:start) { StartTime.new(Time.local(2021, 1, 1)) }
      let(:body) { StringIO.new("dummy\nstream") }

      it "uploads passed IO object to s3" do
        key = "dummy-program/20210101.m4a"
        expect(client).to receive(:put_object).with(bucket: bucket, key: key, body: body)
        s3.save(id, start, body)
      end
    end
  end
end
