require "aws-sdk-eventbridge"

module Radicaster
  module CLI
    class Lambda
      attr_reader :client, :rec_radiko_arn

      def initialize(client, rec_radiko_arn)
        @client = client
        @rec_radiko_arn = rec_radiko_arn
      end

      def record_latest(def_)
        client.invoke(
          function_name: rec_radiko_arn,
          payload: %Q/{"id": "#{def_.id}"}/,
        )
      end
    end
  end
end
