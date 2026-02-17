require "yaml"

module Radicaster
  module GenFeed
    class S3
      FEED_FILENAME = "index.rss"
      DEFINITION_FILENAME = "radicaster.yaml"
      # public access to images are allowed in CloudFront Function
      EPISODE_EXTS = [".m4a"]

      def initialize(client, bucket, url)
        @client = client
        @bucket = bucket
        @url = url
      end

      def find_definition(id)
        key = "radicaster/#{id}.yaml"
        resp = client.get_object(bucket: bucket, key: key)
        def_hash = YAML.load(resp.body.read)
        
        image_url = find_image(id) || def_hash["image"]

        Definition.new(
          title: def_hash["title"],
          author: def_hash["author"],
          summary: def_hash["summary"],
          image: image_url,
        )
      end

      def list_episodes(id)
        prefix = "#{id}/data/"
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
          .sort_by(&:title)
          .reverse
      end

      def save_feed(id, feed_body)
        key = "#{id}/#{FEED_FILENAME}"
        client.put_object(
          bucket: bucket,
          key: key,
          body: feed_body,
          content_type: "application/rss+xml",
        )
      end

      private

      attr_reader :client, :bucket, :url

      def build_public_url(key)
        "#{url}/#{key}"
      end

      def find_image(id)
        resp = client.list_objects_v2(bucket: bucket, prefix: "radicaster/#{id}.")
        resp.contents.each do |c|
          ext = File.extname(c.key)
          if [".jpg", ".jpeg", ".png"].include?(ext.downcase)
            # We want to remove basic auth credentials from the URL for images.
            # The URL is set via environment variable RADICASTER_BUCKET_URL and may include credentials.
            # e.g. https://user:pass@example.com -> https://example.com
            uri = URI.parse(build_public_url(c.key))
            uri.user = nil
            uri.password = nil
            return uri.to_s
          end
        end
        nil
      end
    end
  end
end
