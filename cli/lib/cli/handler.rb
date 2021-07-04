module Radicaster
  module CLI
    class Handler
      def initialize(storage, scheduler, recorder)
        @storage = storage
        @scheduler = scheduler
        @recorder = recorder
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

          puts "Saving the definition to storage..."
          storage.save_definition(def_)

          puts "Registering recording schedule..."
          scheduler.register(def_)

          puts "Recording latest episode..."
          recorder.record_latest(def_)

          puts "Done!"
        end
      end

      private

      attr_reader :storage, :scheduler, :recorder
    end
  end
end
