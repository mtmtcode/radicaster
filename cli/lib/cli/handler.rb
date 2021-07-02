module Radicaster
  module CLI
    class Handler
      def initialize(storage, scheduler)
        @storage = storage
        @scheduler = scheduler
      end

      def handle(argv)
        usage unless argv.length == 1
        def_path = argv[0]

        exec(def_path)
      end

      def usage
        puts <<~EOS
               radicaster - radicasterの録音予約をする
               
               Usage:
                   radicaster <path/to/definition.yaml>
             EOS
        exit(false)
      end

      def exec(def_path)
        open(def_path) do |f|
          def_ = Definition.parse(f.read)
          storage.save_definition(def_)
          scheduler.register(def_)
        end
      end

      private

      attr_reader :storage, :scheduler
    end
  end
end
