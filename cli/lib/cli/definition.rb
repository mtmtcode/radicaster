require "yaml"

class Definition
  attr_reader(
    :program_id,
    :title,
    :author,
    :image,
    :program_starts,
    :rec_start,
    :station_id,
    :area
  )

  def self.load(path)
    open(path) do |f|
      # TODO バリデーション
      h = YAML.load(f.read)
      program_starts = h["program_starts"].map { |s| Schedule.parse(s) }
      rec_start = Schedule.parse(h["rec_start"])

      def_ = self.new(
        program_id: h["program_id"],
        title: h["title"],
        author: h["author"],
        image: h["image"],
        program_starts: program_starts,
        rec_start: rec_start,
        station_id: h["station_id"],
        area: h["area"],
      )
      def_
    end
  end

  def initialize(
    program_id:,
    title:,
    author:,
    image:,
    program_starts:,
    rec_start:,
    station_id:,
    area:
  )
    @program_id = program_id
    @title = title
    @author = author
    @image = image
    @program_starts = program_starts
    @rec_start = rec_start
    @station_id = station_id
    @area = area
  end
end
