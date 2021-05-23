module Radicaster
  module RecRadiko
    class S3
      def initialize(client, bucket)
        @client = client
        @bucket = bucket
      end

      def save(program_id, start, io)
        key = make_key(program_id, start)
        client.put_object(bucket: bucket, key: key, body: io)
      end

      private

      attr_reader :client, :bucket

      def make_key(program_id, start)
        yyyymmdd = start.to_s[0..7]
        "#{program_id}/#{yyyymmdd}.m4a"
      end
    end
  end
end
