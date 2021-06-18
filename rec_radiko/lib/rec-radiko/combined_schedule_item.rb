require "date"

module Radicaster
  module RecRadiko
    class CombinedScheduleItem
      attr_reader :elements

      def initialize(*elements)
        @elements = elements
      end

      def ==(other)
        return false unless other.is_a?(self.class)
        elements == other.elements
      end

      def latest(now)
        elements.map { |x| x.latest(now) }
      end
    end
  end
end
