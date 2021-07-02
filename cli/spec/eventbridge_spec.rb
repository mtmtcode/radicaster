module Radicaster::CLI
  describe EventBridge do
    describe "#schedule" do
      let(:def_) {
        Definition.new(
          id: "test",
          title: "test title",
          author: "test author",
          image: "https://radicaster.test/exmaple.png",
          program_schedule: program_schedule,
          execution_schedule: execution_schedule,
          station: "TBS",
          area: "JP13",
        )
      }
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

      let(:func_arn_map) { { "rec-radiko" => "arn:aws:lambda:dummy" } }
      let(:client) { instance_double(Aws::EventBridge::Client) }
      subject(:eb) { EventBridge.new(client, func_arn_map) }

      it "registers recording schedule to AWS EventBrdige" do
        expect(client).to receive(:put_rule).with(
          name: "test_0",
          schedule_expression: "cron(0 3 ? * Mon *)",
        )
        expect(client).to receive(:put_targets).with(
          rule: "test_0",
          targets: [{
            id: "rec-radiko",
            arn: "arn:aws:lambda:dummy",
            input: %q/{"id":"test"}/,
          }],
        )
        expect(client).to receive(:put_rule).with(
          name: "test_1",
          schedule_expression: "cron(0 3 ? * Tue *)",
        )
        expect(client).to receive(:put_targets).with(
          rule: "test_1",
          targets: [{
            id: "rec-radiko",
            arn: "arn:aws:lambda:dummy",
            input: %q/{"id":"test"}/,
          }],
        )
        eb.register(def_)
      end
    end
  end
end
