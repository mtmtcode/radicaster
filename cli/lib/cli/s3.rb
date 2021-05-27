module Radicaster::CLI
  class S3
    def initialize(client, bucket)
      @client = client
      @bucket = bucket
    end

    def save_definition(def_)
      client.put_object(
        bucket: bucket,
        key: "#{def_.program_id}/radicaster.yaml",
        body: StringIO.new("dummy yaml"),
      )
    end

    private

    attr_reader :client, :bucket
  end
end
