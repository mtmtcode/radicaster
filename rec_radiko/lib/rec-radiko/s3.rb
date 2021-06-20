module Radicaster
  module RecRadiko
    class S3
      def initialize(client, bucket)
        @client = client
        @bucket = bucket
      end

      def find_definition(id)
        resp = client.get_object(bucket: bucket, key: "#{id}/radicaster.yaml")
        Definition.parse(resp.body.read)
      end

      def save(id, start, io)
        key = make_key(id, start)
        client.put_object(bucket: bucket, key: key, body: io)
      end

      private

      attr_reader :client, :bucket

      def make_key(id, start)
        yyyymmdd = start.to_s[0..7]
        "#{id}/#{yyyymmdd}.m4a"
      end
    end
  end
end
