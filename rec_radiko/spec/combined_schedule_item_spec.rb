module Radicaster::RecRadiko
  describe CombinedScheduleItem do
    describe "#==" do
      let(:this) do
        CombinedScheduleItem.new(
          ScheduleItem.new("Mon", 8, 30, 0),
          ScheduleItem.new("Mon", 10, 0, 0),
        )
      end

      where(:other, :expected) do
        [
          # 完全に同じ
          [CombinedScheduleItem.new(
            ScheduleItem.new("Mon", 8, 30, 0),
            ScheduleItem.new("Mon", 10, 0, 0),
          ), true],
          # 要素が等しくない
          [CombinedScheduleItem.new(
            ScheduleItem.new("Mon", 8, 30, 1),
            ScheduleItem.new("Mon", 10, 0, 0),
          ), false],
          # 型が違う
          [ScheduleItem.new("Mon", 8, 30, 1), false],
          [nil, false],
        ]
      end

      with_them do
        subject { this == other }
        it { is_expected.to eq(expected) }
      end
    end

    describe "#latest" do
      let(:now) { Time.new(2021, 6, 14, 12, 0, 0, "+09:00") }  # monday
      let(:item) do
        CombinedScheduleItem.new(
          ScheduleItem.new("Mon", 8, 30, 0),
          ScheduleItem.new("Mon", 10, 0, 0),
        )
      end
      subject(:latest) { item.latest(now) }

      it "returns latest scheduled time of the first element" do
        expect(latest).to eq([
                            Time.new(2021, 6, 14, 8, 30, 0, "+09:00"),
                            Time.new(2021, 6, 14, 10, 0, 0, "+09:00"),
                          ])
      end
    end
  end
end
