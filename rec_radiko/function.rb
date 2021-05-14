$LOAD_PATH.unshift(File.dirname(__FILE__) + "/lib")

require "logger"
require "rec-radiko"
require "aws-sdk-s3"

logger = Logger.new(STDOUT)

radigo_home = "/tmp"
radiko = Radicaster::RecRadiko::Radigo.new(radigo_home)
concater = Radicaster::RecRadiko::Ffmpeg.new
recorder = Radicaster::RecRadiko::Recorder.new(radiko, concater)

s3 = Aws::S3::Client.new
storage = Radigo::RecRadiko::S3.new(s3)

handler = Radicaster::RecRadiko::Handler.new(logger, recorder, storage)
