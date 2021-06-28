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

      def save_episode(episode)
        key = make_key(episode)
        open(episode.local_path) do |f|
          client.put_object(bucket: bucket, key: key, body: f)
        end
      end

      private

      attr_reader :client, :bucket

      def make_key(episode)
        id = episode.id
        yyyymmdd = episode.start_time.strftime("%Y%m%d")
        "#{id}/#{yyyymmdd}.m4a"
      end
    end
  end
end
