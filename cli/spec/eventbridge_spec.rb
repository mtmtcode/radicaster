module Radicaster::CLI
  describe EventBridge do
    describe "#schedule" do
      let(:def_) {
        Definition.new(
          id: "test",
          title: "test title",
          author: "test author",
          image: "https://radicaster.test/exmaple.png",
          program_starts: program_starts,
          rec_start: rec_start,
          station: "TBS",
          area: "JP13",
        )
      }
      let(:program_starts) {
        [
          Schedule.new(wday: "Tue", hour: 1, min: 0),
          Schedule.new(wday: "Tue", hour: 2, min: 0),
        ]
      }
      let(:rec_start) { Schedule.new(wday: "Tue", hour: 3, min: 3) }

      let(:func_arn_map) { { "rec-radiko" => "arn:aws:lambda:dummy" } }
      let(:client) { instance_double(Aws::EventBridge::Client) }
      subject(:eb) { EventBridge.new(client, func_arn_map) }

      it "registers recording schedule to AWS EventBrdige" do
        expect(client).to receive(:put_rule).with(
          name: "test",
          schedule_expression: "cron(3 18 ? * Mon *)",
        )
        expect(client).to receive(:put_targets).with(
          rule: "test",
          targets: [{
            id: "rec-radiko",
            arn: "arn:aws:lambda:dummy",
            input: %q/{"id":"test","area":"JP13","station":"TBS","starts":["Tue 01:00:00","Tue 02:00:00"]}/,
          }],
        )
        eb.register(def_)
      end
    end
  end
end
