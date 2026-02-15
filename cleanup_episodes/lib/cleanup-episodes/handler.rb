require "aws-sdk-s3"
require "yaml"
require "json"
require "date"

module Radicaster
  module CleanupEpisodes
    # m4aファイルアップロード時に発動し、保持ポリシーに基づいて古いエピソードを削除する
    class Handler
      EPISODE_EXT = ".m4a"
      # ファイル名から日付を抽出する正規表現 (YYYYMMDD.m4a)
      DATE_PATTERN = /(\d{8})\.m4a\z/

      def initialize(logger, s3_client, bucket)
        @logger = logger
        @s3_client = s3_client
        @bucket = bucket
      end

      def handle(event:, context:)
        logger.info("Start cleanup episode handling.")
        id = extract_id(event)
        definition = load_definition(id)

        unless definition
          logger.info("Definition not found for id: #{id}. Skipping.")
          return
        end

        retention_type = definition["retention_type"]
        retention_value = definition["retention_value"]

        unless retention_type && retention_value
          logger.info("No retention policy set for id: #{id}. Skipping.")
          return
        end

        case retention_type
        when "count"
          cleanup_by_count(id, retention_value.to_i)
        when "days"
          cleanup_by_days(id, retention_value.to_i)
        else
          logger.info("Unknown retention_type: #{retention_type}. Skipping.")
        end

        logger.info("Cleanup episode handling finished.")
      end

      private

      attr_reader :logger, :s3_client, :bucket

      def extract_id(event)
        event = JSON.parse(event["Records"][0]["Sns"]["Message"]) if event["Records"][0]["Sns"]
        raise '"s3" is not contained in the event' unless event["Records"][0]["s3"]
        key = event["Records"][0]["s3"]["object"]["key"]
        logger.debug("S3 key: #{key}")
        # key format: {id}/data/{YYYYMMDD}.m4a
        key.split("/").first
      end

      def load_definition(id)
        key = "radicaster/#{id}.yaml"
        resp = s3_client.get_object(bucket: bucket, key: key)
        YAML.load(resp.body.read)
      rescue Aws::S3::Errors::NoSuchKey
        nil
      end

      def list_episodes(id)
        prefix = "#{id}/data/"
        resp = s3_client.list_objects_v2(bucket: bucket, prefix: prefix)
        return [] unless resp.contents

        resp.contents
          .select { |obj| obj.key.end_with?(EPISODE_EXT) }
          .sort_by { |obj| obj.key }
      end

      def extract_date_from_key(key)
        match = key.match(DATE_PATTERN)
        return nil unless match
        Date.strptime(match[1], "%Y%m%d")
      rescue Date::Error
        nil
      end

      def cleanup_by_count(id, keep_count)
        episodes = list_episodes(id)
        logger.info("Found #{episodes.size} episodes for id: #{id}, keeping last #{keep_count}")

        return if episodes.size <= keep_count

        # ファイル名(日付)でソートされているので、古い順に並んでいる
        # 末尾のkeep_count個を残して、先頭の古いものを削除
        to_delete = episodes[0..-(keep_count + 1)]

        to_delete.each do |obj|
          logger.info("Deleting old episode: #{obj.key}")
          s3_client.delete_object(bucket: bucket, key: obj.key)
        end

        logger.info("Deleted #{to_delete.size} episodes for id: #{id}")
      end

      def cleanup_by_days(id, keep_days)
        episodes = list_episodes(id)
        cutoff_date = Date.today - keep_days
        logger.info("Found #{episodes.size} episodes for id: #{id}, deleting before #{cutoff_date}")

        deleted_count = 0
        episodes.each do |obj|
          episode_date = extract_date_from_key(obj.key)
          next unless episode_date

          if episode_date < cutoff_date
            logger.info("Deleting old episode: #{obj.key} (date: #{episode_date})")
            s3_client.delete_object(bucket: bucket, key: obj.key)
            deleted_count += 1
          end
        end

        logger.info("Deleted #{deleted_count} episodes for id: #{id}")
      end
    end
  end
end
