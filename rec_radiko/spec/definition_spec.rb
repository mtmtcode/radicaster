module Radicaster::RecRadiko
  describe Definition do
    describe ".parse" do
      context "input is valid" do
        subject { Definition.parse(input) }

        context "and has single start time" do
          let(:input) do
            <<~EOS
              id: test
              title: テスト番組
              author: テスト太郎
              image: http://example.com/cover.png
              area: JP13
              station: TEST
              program_schedule: Tue 01:00:00
              rec_start: Tue 03:03:00
            EOS
          end
          it {
            is_expected.to eq(Definition.new(
              id: "test",
              area: "JP13",
              station: "TEST",
              program_schedule: Schedule.new(ScheduleItem.new("Tue", 1, 0, 0)),
            ))
          }
        end

        context "and has multiple start times" do
          let(:input) do
            <<~EOS
              id: test
              title: テスト番組
              author: テスト太郎
              image: http://example.com/cover.png
              area: JP13
              station: TEST
              program_schedule:
              - Mon 08:30:00
              - Tue 08:30:00
              rec_start: Tue 03:03:00
            EOS
          end
          it {
            is_expected.to eq(Definition.new(
              id: "test",
              area: "JP13",
              station: "TEST",
              program_schedule: Schedule.new(
                ScheduleItem.new("Mon", 8, 30, 0),
                ScheduleItem.new("Tue", 8, 30, 0),
              ),
            ))
          }
        end

        context "and has combined start times" do
          let(:input) do
            <<~EOS
              id: test
              title: テスト番組
              author: テスト太郎
              image: http://example.com/cover.png
              area: JP13
              station: TEST
              program_schedule:
              - ["Mon 08:30:00", "Mon 10:00:00"]
              rec_start: Tue 03:03:00
            EOS
          end
          it {
            is_expected.to eq(Definition.new(
              id: "test",
              area: "JP13",
              station: "TEST",
              program_schedule: Schedule.new(
                CombinedScheduleItem.new(ScheduleItem.new("Mon", 8, 30, 0), ScheduleItem.new("Mon", 10, 0, 0))
              ),
            ))
          }
        end
      end

      context "input is invlalid" do
        context "required key not found" do
          where(:input) do
            [
              [
                <<~EOS
                  area: JP13
                  station: TEST
                  program_schedule:
                  - ["Mon 08:30:00", "Mon 10:00:00"]
                EOS
              ],
              [
                <<~EOS
                  id: test
                  station: TEST
                  program_schedule:
                  - ["Mon 08:30:00", "Mon 10:00:00"]
                EOS
              ],
              [
                <<~EOS
                  id: test
                  area: JP13
                  program_schedule:
                  - ["Mon 08:30:00", "Mon 10:00:00"]
                EOS
              ],
              [
                <<~EOS
                  id: test
                  area: JP13
                  station: TEST
                EOS
              ],
            ]
          end

          with_them do
            it "raises an ArgumentError" do
              expect { Definition.parse(input) }.to raise_error(ArgumentError)
            end
          end
        end
      end
    end

    describe "#==" do
      let!(:this) do
        Definition.new(
          id: "test",
          area: "JP13",
          station: "TEST",
          program_schedule: Schedule.new(
            ScheduleItem.new("Mon", 8, 30, 0),
            ScheduleItem.new("Tue", 8, 30, 0),
          ),
        )
      end

      where(:id, :area, :station, :starts, :expected) do
        [
          ["test", "JP13", "TEST", Schedule.new(ScheduleItem.new("Mon", 8, 30, 0), ScheduleItem.new("Tue", 8, 30, 0)), true],
          ["testX", "JP13", "TEST", Schedule.new(ScheduleItem.new("Mon", 8, 30, 0), ScheduleItem.new("Tue", 8, 30, 0)), false],
          ["test", "JP13X", "TEST", Schedule.new(ScheduleItem.new("Mon", 8, 30, 0), ScheduleItem.new("Tue", 8, 30, 0)), false],
          ["test", "JP13", "TESTX", Schedule.new(ScheduleItem.new("Mon", 8, 30, 0), ScheduleItem.new("Tue", 8, 30, 0)), false],
          ["test", "JP13", "TEST", Schedule.new(ScheduleItem.new("Mon", 8, 30, 1), ScheduleItem.new("Tue", 8, 30, 0)), false],
        ]
      end

      let(:other) { Definition.new(id: id, area: area, station: station, program_schedule: starts) }
      subject { this == other }

      with_them do
        it { is_expected.to eq expected }
      end
    end
  end
end
