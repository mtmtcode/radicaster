module Radicaster
  module RecRadiko
    class Schedule
      attr_reader :items

      def initialize(*items)
        @items = items
      end

      def ==(other)
        return false unless other.is_a? Schedule
        items == other.items
      end

      def latest(now)
        # 各itemをlatestを取得して、最初の要素が直近のものを返す
        items.map { |x|
          latest = x.latest(now)
          latest.is_a?(Array) ? latest : [latest]
        }
          .sort { |a, b| a[0] <=> b[0] }
          .last
      end
    end
  end
end
