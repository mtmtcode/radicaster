$LOAD_PATH.unshift(File.dirname(__FILE__) + "/lib")

require "logger"
require "rec-radiko"
require "aws-sdk-s3"

logger = Logger.new(STDOUT)

radigo_home = "/tmp"
radiko_mail = ENV["RADIKO_MAIL"]
radiko_password = ENV["RADIKO_PASSWORD"]
radiko = Radicaster::RecRadiko::Radigo.new(radigo_home, radiko_mail, radiko_password)
concater = Radicaster::RecRadiko::Ffmpeg.new
recorder = Radicaster::RecRadiko::Recorder.new(radiko, concater)

bucket = ENV["S3_BUCKET"] or raise "ENV['S3_BUCKET'] must be set"
s3 = Aws::S3::Client.new
storage = Radicaster::RecRadiko::S3.new(s3, bucket)

Handler = Radicaster::RecRadiko::Handler.new(logger, recorder, storage)
