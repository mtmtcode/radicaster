require "json"

def handle(event:, context:)
  p event
  p context
  { event: JSON.generate(event), context: JSON.generate(context.inspect) }
end
