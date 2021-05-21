require "yaml"

module Radicaster
  module GenFeed
    class S3
      FEED_FILENAME = "index.rss"
      DEFINITION_FILENAME = "radicaster.yaml"
      EPISODE_EXTS = [".m4a", ".mp3"]

      def initialize(client, bucket, url)
        @client = client
        @bucket = bucket
        @url = url
      end

      def find_definition(program_id)
        key = "#{program_id}/#{DEFINITION_FILENAME}"
        resp = client.get_object(bucket: bucket, key: key)
        def_hash = YAML.load(resp.body.read)
        Definition.new(
          title: def_hash["title"],
          author: def_hash["author"],
          summary: def_hash["summary"],
          image: def_hash["image"],
        )
      end

      def list_episodes(program_id)
        prefix = program_id + "/"
        resp = client.list_objects_v2(bucket: bucket, prefix: prefix)
        resp
          .contents
          .filter { |c| EPISODE_EXTS.include?(Pathname.new(c.key).extname) }
          .map { |c|
          Episode.new(
            url: build_public_url(c.key),
            size: c.size,
            last_modified: c.last_modified,
          )
        }
          .sort_by(&:filename)
          .reverse
      end

      def save_feed(program_id, feed_body)
        key = "#{program_id}/#{FEED_FILENAME}"
        client.put_object(
          bucket: bucket,
          key: key,
          body: feed_body,
        )
      end

      private

      attr_reader :client, :bucket, :url

      def build_public_url(key)
        "#{url}/#{key}"
      end
    end
  end
end