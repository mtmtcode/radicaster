require "aws-sdk-eventbridge"

module Radicaster
  module CLI
    class EventBridge
      TARGET_ID_RADIKO = "rec-radiko"

      def initialize(client, rec_radiko_arn)
        @client = client
        @rec_radiko_arn = rec_radiko_arn
      end

      def register(def_)
        def_.execution_schedule.each_with_index do |item, index|
          name = "#{def_.id}_#{index}"
          client.put_rule(
            name: name,
            schedule_expression: item.to_cron,
          )

          client.put_targets(
            rule: name,
            targets: [{
              id: TARGET_ID_RADIKO,
              arn: rec_radiko_arn,
              input: JSON.generate({ id: def_.id }),
            }],
          )
        end
      end

      private

      attr_reader :client, :rec_radiko_arn
    end
  end
end
