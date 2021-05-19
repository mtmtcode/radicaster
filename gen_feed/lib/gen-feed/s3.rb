require "yaml"

module Radicaster
  module GenFeed
    class S3
      FEED_FILENAME = "index.rss"
      DEFINITION_FILENAME = "radicaster.yaml"

      def initialize(client)
        @client = client
      end

      def find_definition(bucket, prefix)
        key = "#{prefix}/#{DEFINITION_FILENAME}"
        resp = client.get_object(bucket: bucket, key: key)
        def_hash = YAML.load(resp.body.read)
        Definition.new(
          title: def_hash["title"],
          author: def_hash["author"],
          summary: def_hash["summary"],
          image: def_hash["image"],
        )
      end

      def save(bucket, prefix, feed_body)
        key = "#{prefix}/#{FEED_FILENAME}"
        client.put_object(
          bucket: bucket,
          key: key,
          body: feed_body,
        )
      end

      private

      attr_reader :client
    end
  end
end
