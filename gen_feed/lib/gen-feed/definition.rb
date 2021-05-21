module Radicaster
  module GenFeed
    # Podcastの定義
    class Definition
      attr_reader :title, :author, :summary, :image

      def initialize(title:, author: nil, summary: nil, image: nil)
        @title = title
        @author = author
        @summary = summary
        @image = image
      end
    end
  end
end
