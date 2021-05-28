require "yaml"

class Definition
  attr_reader(
    :id,
    :title,
    :author,
    :image,
    :program_starts,
    :rec_start,
    :station,
    :area
  )

  def self.load(path)
    open(path) do |f|
      # TODO バリデーション
      h = YAML.load(f.read)
      program_starts = h["program_starts"].map { |s| Schedule.parse(s) }
      rec_start = Schedule.parse(h["rec_start"])

      def_ = self.new(
        id: h["id"],
        title: h["title"],
        author: h["author"],
        image: h["image"],
        program_starts: program_starts,
        rec_start: rec_start,
        station: h["station"],
        area: h["area"],
      )
      def_
    end
  end

  def initialize(
    id:,
    title:,
    author:,
    image:,
    program_starts:,
    rec_start:,
    station:,
    area:
  )
    @id = id
    @title = title
    @author = author
    @image = image
    @program_starts = program_starts
    @rec_start = rec_start
    @station = station
    @area = area
  end
end
