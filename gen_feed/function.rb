$LOAD_PATH.unshift(File.dirname(__FILE__) + "/lib")

require "logger"
require "gen-feed"
require "aws-sdk-s3"

logger = Logger.new(STDOUT)

region = ENV["AWS_REGION"] or raise "ENV['AWS_REGION'] must be set"
bucket = ENV["S3_BUCKET"] or raise "ENV['S3_BUCKET'] must be set"
url = ENV["BUCKET_URL"] or raise "ENV['BUCKET_URL'] must be set"

s3_client = Aws::S3::Client.new(region: region)
storage = Radicaster::GenFeed::S3.new(s3_client, bucket, url)

generator = Radicaster::GenFeed::FeedGenerator.new

Handler = Radicaster::GenFeed::Handler.new(logger, region, bucket, storage, generator)
