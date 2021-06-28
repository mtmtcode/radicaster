require "tempfile"

module Radicaster::CLI
  describe Definition do
    describe ".parse" do
      context "full schedule format" do
        it "returns parsed result" do
          yaml_def = <<~EOS
            id: test
            station: TEST
            area: JP13
            title: test title
            author: test author
            image: https://radicaster.test/example.png
            program_schedule:
            - ["Mon 08:30:00", "Mon 10:00:00"]
            - ["Tue 08:30:00", "Tue 10:00:00"]
            execution_schedule:
            - Mon 12:00:00
            - Tue 12:00:00
          EOS
          def_ = Definition.parse(yaml_def)

          expect(def_).to eq(Definition.new(
            id: "test",
            area: "JP13",
            station: "TEST",
            title: "test title",
            author: "test author",
            image: "https://radicaster.test/example.png",
            program_schedule: [
              ["Mon 08:30:00", "Mon 10:00:00"],
              ["Tue 08:30:00", "Tue 10:00:00"],
            ],
            execution_schedule: [
              ExecutionSchedule.new("Mon", 12, 0),
              ExecutionSchedule.new("Tue", 12, 0),
            ],
          ))
        end
      end
      context "simple schedule format" do
        it "returns parsed result" do
          yaml_def = <<~EOS
            id: test
            station: TEST
            area: JP13
            title: test title
            author: test author
            image: https://radicaster.test/example.png
            program_schedule: Tue 01:00:00
            execution_schedule: Tue 03:03:00
          EOS
          def_ = Definition.parse(yaml_def)

          expect(def_).to eq(Definition.new(
            id: "test",
            area: "JP13",
            station: "TEST",
            title: "test title",
            author: "test author",
            image: "https://radicaster.test/example.png",
            program_schedule: [
              ["Tue 01:00:00"],
            ],
            execution_schedule: [
              ExecutionSchedule.new("Tue", 3, 3),
            ],
          ))
        end
      end
    end

    describe "#to_yaml" do
      subject(:def_) {
        Definition.new(
          id: "test",
          area: "JP13",
          station: "TEST",
          title: "test title",
          author: "test author",
          image: "http://radicaster.test/example.png",
          program_schedule: [
            "Tue 01:00:00",
            "Tue 02:00:00",
          ],
          execution_schedule: [ExecutionSchedule.new("Tue", 3, 3)],
        )
      }

      it "returns expected yaml string" do
        expect(YAML.load(def_.to_yaml)).to eq({
          "id" => "test",
          "area" => "JP13",
          "station" => "TEST",
          "title" => "test title",
          "author" => "test author",
          "image" => "http://radicaster.test/example.png",
          "program_schedule" => ["Tue 01:00:00", "Tue 02:00:00"],
          "execution_schedule" => ["Tue 03:03:00"],
        })
      end
    end

    describe "#==" do
      let(:this) {
        Definition.new(
          id: "test",
          title: "test title",
          area: "JP13",
          station: "TEST",
          author: "test author",
          image: "http://radicaster.test/example.png",
          program_schedule: [["Tue 01:00:00", "Tue 02:00:00"]],
          execution_schedule: [ExecutionSchedule.new("Tue", 3, 3)],
        )
      }
      where(:other, :expected) do
        [
          [Definition.new(
            id: "test",
            title: "test title",
            area: "JP13",
            station: "TEST",
            author: "test author",
            image: "http://radicaster.test/example.png",
            program_schedule: [["Tue 01:00:00", "Tue 02:00:00"]],
            execution_schedule: [ExecutionSchedule.new("Tue", 3, 3)],
          ), true],
          [Definition.new(
            id: "xtest",
            title: "test title",
            area: "JP13",
            station: "TEST",
            author: "test author",
            image: "http://radicaster.test/example.png",
            program_schedule: [["Tue 01:00:00", "Tue 02:00:00"]],
            execution_schedule: [ExecutionSchedule.new("Tue", 3, 3)],
          ), false],
          [Definition.new(
            id: "test",
            title: "xtest title",
            area: "JP13",
            station: "TEST",
            author: "test author",
            image: "http://radicaster.test/example.png",
            program_schedule: [["Tue 01:00:00", "Tue 02:00:00"]],
            execution_schedule: [ExecutionSchedule.new("Tue", 3, 3)],
          ), false],
          [Definition.new(
            id: "test",
            title: "test title",
            area: "JP12",
            station: "TEST",
            author: "test author",
            image: "http://radicaster.test/example.png",
            program_schedule: [["Tue 01:00:00", "Tue 02:00:00"]],
            execution_schedule: [ExecutionSchedule.new("Tue", 3, 3)],
          ), false],
          [Definition.new(
            id: "test",
            title: "test title",
            area: "JP13",
            station: "TESTX",
            author: "test author",
            image: "http://radicaster.test/example.png",
            program_schedule: [["Tue 01:00:00", "Tue 02:00:00"]],
            execution_schedule: [ExecutionSchedule.new("Tue", 3, 3)],
          ), false],
          [Definition.new(
            id: "test",
            title: "test title",
            area: "JP13",
            station: "TEST",
            author: "xtest author",
            image: "http://radicaster.test/example.png",
            program_schedule: [["Tue 01:00:00", "Tue 02:00:00"]],
            execution_schedule: [ExecutionSchedule.new("Tue", 3, 3)],
          ), false],
          [Definition.new(
            id: "test",
            title: "test title",
            area: "JP13",
            station: "TEST",
            author: "test author",
            image: "http://radicaster.test/example.x.png",
            program_schedule: [["Tue 01:00:00", "Tue 02:00:00"]],
            execution_schedule: [ExecutionSchedule.new("Tue", 3, 3)],
          ), false],
          [Definition.new(
            id: "test",
            title: "test title",
            area: "JP13",
            station: "TEST",
            author: "test author",
            image: "http://radicaster.test/example.png",
            program_schedule: [["Tue 01:00:00", "Tue 02:00:01"]],
            execution_schedule: [ExecutionSchedule.new("Tue", 3, 3)],
          ), false],
          [Definition.new(
            id: "test",
            title: "test title",
            area: "JP13",
            station: "TEST",
            author: "test author",
            image: "http://radicaster.test/example.png",
            program_schedule: [["Tue 01:00:00", "Tue 02:00:00"]],
            execution_schedule: [ExecutionSchedule.new("Tue", 3, 4)],
          ), false],
        ]
      end
      subject { this == other }
      with_them do
        it { is_expected.to eq(expected) }
      end
    end
  end
end
