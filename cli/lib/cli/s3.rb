module Radicaster::CLI
  class S3
    def initialize(client)
      @client = client
    end

    def save_definition(def_)
    end

    private

    attr_reader :client
  end
end
