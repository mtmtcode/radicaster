module Radicaster::CLI
  describe Lambda do
    describe "#record_latest" do

      let(:program_schedule) {
        [
          ["Mon 08:30:00"],
          ["Tue 08:30:00"],
        ]
      }
      let(:execution_schedule) {
        [
          ExecutionSchedule.new("Mon", 12, 0),
          ExecutionSchedule.new("Tue", 12, 0),
        ]
      }

      let(:def_) {
        Definition.new(
          id: "test",
          title: "test title",
          author: "test author",
          image: "https://radicaster.test/exmaple.png",
          program_schedule: [["Tue 01:00:00"]],
          execution_schedule: [ExecutionSchedule.new("Tue", 3, 3)],
          station: "TEST",
          area: "JP13",
        )
      }
      let(:rec_radiko_arn) { "arn:aws:lambda:dummy" }
      let(:client) { instance_double(Aws::Lambda::Client) }

      subject(:lambda) { Lambda.new(client, rec_radiko_arn) }

      it "invokes recording lambda" do
        expect(client).to receive(:invoke).with({
          function_name: "arn:aws:lambda:dummy",
          payload: '{"id": "test"}',
        })
        lambda.record_latest(def_)
      end
    end
  end
end
