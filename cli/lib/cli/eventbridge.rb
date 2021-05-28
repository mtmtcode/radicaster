require "aws-sdk-eventbridge"

module Radicaster
  module CLI
    class EventBridge
      TARGET_ID_RADIKO = "rec-radiko"

      def initialize(client, func_arn_map)
        @client = client
        @func_arn_map = func_arn_map
      end

      def register(def_)
        client.put_rule(
          name: def_.program_id,
          schedule_expression: def_.rec_start.cron,
        )

        input = {
          id: def_.program_id,
          area: def_.area,
          station_id: def_.station_id,
          starts: def_.program_starts.map(&:to_s),
        }

        client.put_targets(
          rule: def_.program_id,
          targets: [{
            id: TARGET_ID_RADIKO,
            arn: func_arn_map[TARGET_ID_RADIKO],
            input: JSON.generate(input),
          }],
        )
      end

      private

      attr_reader :client, :func_arn_map
    end
  end
end
