module Radicaster
  module RecRadiko
    class S3
      def initialize(client)
        @client = client
      end

      def save(bucket, key, io)
        client.put_object(bucket: bucket, key: key, body: io)
      end

      private

      attr_reader :client
    end
  end
end
