require "tempfile"

module Radicaster::CLI
  describe Definition do
    describe "load" do
      it "loads definition from the specified file" do
        tmp = Tempfile.new("dummy")
        tmp.write(<<~EOS
          program_id: test
          station_id: TEST
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
        expect(def_.program_id).to eq("test")
        expect(def_.station_id).to eq("TEST")
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
  end
end
