module Radicaster
  module GenFeed
    class S3
      FEED_FILENAME = "index.rss"

      def initialize(client)
        @client = client
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
