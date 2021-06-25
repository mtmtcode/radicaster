module Radicaster
  module RecRadiko
    class Episode
      attr_reader :id, :station, :start_time, :local_path

      def initialize(id:, station:, start_time:, local_path:)
        @id = id
        @start_time = start_time
        @local_path = local_path
      end

      def ==(other)
        return false unless other.is_a? Episode
        id == other.id && start_time = other.start_time && local_path == other.local_path
      end
    end
  end
end
