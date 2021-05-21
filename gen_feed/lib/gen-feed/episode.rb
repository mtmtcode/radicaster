module Radicaster
  module GenFeed
    class Episode
      attr_reader :url, :size, :last_modified

      def initialize(url:, size:, last_modified:)
        @url = url
        @size = size
        @last_modified = last_modified
      end

      def filename
        url.split("/")[-1]
      end
    end
  end
end
