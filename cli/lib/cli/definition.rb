require "yaml"

module Radicaster
  module CLI
    class Definition
      attr_reader(
        :id,
        :station,
        :area,
        :title,
        :author,
        :image,
        :program_schedule,
        :execution_schedule,
        :raw
      )

      def self.parse(yaml_def)
        h = YAML.load(yaml_def, symbolize_names: true)

        # TODO スキーマに従ってバリデーション

        # 番組スケジュールが二次元配列でない場合は二次元配列に変換
        program_schedule = h[:program_schedule].is_a?(Array) ? h[:program_schedule] : [h[:program_schedule]]
        program_schedule = program_schedule.map { |item| item.is_a?(Array) ? item : [item] }

        # 実行スケジュールが配列でない場合は配列に変換
        execution_schedule = h[:execution_schedule].is_a?(Array) ? h[:execution_schedule] : [h[:execution_schedule]]

        self.new(
          id: h[:id],
          station: h[:station],
          area: h[:area],
          title: h[:title],
          author: h[:author],
          image: h[:image],
          program_schedule: program_schedule,
          execution_schedule: execution_schedule.map { |s| ExecutionSchedule.parse(s) },
        )
      end

      def initialize(
        id:,
        title:,
        station:,
        area:,
        author:,
        image:,
        program_schedule:,
        execution_schedule:
      )
        @id = id
        @title = title
        @station = station
        @area = area
        @author = author
        @image = image
        @program_schedule = program_schedule
        @execution_schedule = execution_schedule
      end

      def to_yaml()
        {
          "id" => id,
          "area" => area,
          "station" => station,
          "title" => title,
          "author" => author,
          "image" => image,
          "program_schedule" => program_schedule,
          "execution_schedule" => execution_schedule.map(&:to_yaml),
        }.to_yaml
      end

      def ==(other)
        other.is_a?(self.class) &&
        id == other.id &&
        station == other.station &&
          area == other.area &&
          title == other.title &&
          author == other.author &&
          image == other.image &&
          program_schedule == other.program_schedule &&
          execution_schedule == other.execution_schedule
      end
    end
  end
end
