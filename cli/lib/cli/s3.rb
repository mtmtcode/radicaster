module Radicaster::CLI
  class S3
    def initialize(client, bucket)
      @client = client
      @bucket = bucket
    end

    def save_definition(def_)
      client.put_object(
        bucket: bucket,
        key: "#{def_.id}/radicaster.yaml",
        body: StringIO.new(def_.to_yaml),
      )
    end

    private

    attr_reader :client, :bucket
  end
end
