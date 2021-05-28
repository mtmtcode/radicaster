require "tempfile"

module Radicaster::CLI
  describe Definition do
    describe "load" do
      it "loads definition from the specified file" do
        tmp = Tempfile.new("dummy")
        tmp.write(<<~EOS
          id: test
          station: TEST
          area: JP13
          title: test title
          author: test author
          image: https://radicaster.test/example.png
          program_starts:
          - Mon 01:00:00
          - Mon 02:00:00
          rec_start: Mon 03:03:00
        EOS
)
        tmp.close

        def_ = Definition.load(tmp.path)
        expect(def_.id).to eq("test")
        expect(def_.station).to eq("TEST")
        expect(def_.area).to eq("JP13")
        expect(def_.title).to eq("test title")
        expect(def_.author).to eq("test author")
        expect(def_.image).to eq("https://radicaster.test/example.png")
        # expect(def_.program_starts).to eq()
        # expect(def_.rec_start).to eq()
      ensure
        tmp.unlink
      end
    end

    describe "#to_yaml" do
      subject(:def_) {
        Definition.new(
          id: "test",
          title: "test title",
          author: "test author",
          image: "http://radicaster.test/example.png",
          program_starts: [
            Schedule.new(wday: "Tue", hour: 1, min: 0),
            Schedule.new(wday: "Tue", hour: 2, min: 0),
          ],
          rec_start: Schedule.new(wday: "Tue", hour: 3, min: 3),
          station: "TBS",
          area: "JP13",
        )
      }

      it "returns expected yaml string" do
        expect(YAML.load(def_.to_yaml)).to eq({
          "id" => "test",
          "title" => "test title",
          "author" => "test author",
          "image" => "http://radicaster.test/example.png",
          "program_starts" => ["Tue 01:00:00", "Tue 02:00:00"],
          "rec_start" => "Tue 03:03:00",
          "station" => "TBS",
          "area" => "JP13",
        })
      end
    end
  end
end
