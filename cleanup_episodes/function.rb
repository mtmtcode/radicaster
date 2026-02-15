$LOAD_PATH.unshift(File.dirname(__FILE__) + "/lib")

require "logger"
require "cleanup-episodes"
require "aws-sdk-s3"

logger = Logger.new(STDOUT)

bucket = ENV["RADICASTER_S3_BUCKET"] or raise "ENV['RADICASTER_S3_BUCKET'] must be set"

s3_client = Aws::S3::Client.new

Handler = Radicaster::CleanupEpisodes::Handler.new(logger, s3_client, bucket)
