module Radicaster::RecRadiko
  describe Radigo do
    let(:workdir) { "/tmp" }

    describe "#initialize" do
      context "normal caess" do
        where(:email, :password) do
          [
            [nil, nil],
            ["test@radicaster.test", "password"],
          ]
        end

        with_them do
          it "does not raise error" do
            expect { Radigo.new(workdir, email, password) }.to_not raise_error
          end
        end
      end

      context "abnormal cases" do
        where(:email, :password) do
          [
            ["test@radicaster.net", nil],
            [nil, "password"],
          ]
        end

        with_them do
          it "raises RuntimeError" do
            expect { Radigo.new(workdir, email, password) }.to raise_error(RuntimeError)
          end
        end
      end
    end

    describe "#rec" do
      let(:area) { "JP13" }
      let(:id) { "TBS" }
      let(:start) { StartTime.new(Time.local(2020, 11, 22, 1, 0, 0)) }

      context "when credentials are not specified" do
        subject(:radiko) { Radigo.new(workdir) }
        it "executes radigo without credentials" do
          allow(radiko).to receive(:system)

          ret = radiko.rec(area, id, start)

          expect(ret).to eq("/tmp/20201122010000-TBS.aac")
          expect(radiko).to have_received(:system).with("rm -f /tmp/20201122010000-TBS.aac").ordered
          expect(radiko).to have_received(:system).with("env RADIGO_HOME=/tmp radigo rec -area=JP13 -id=TBS -s=20201122010000", exception: true).ordered
        end
      end

      context "when credentials are specified" do
        let(:email) { "test@radicaster.test" }
        let(:password) { "password" }
        subject(:radiko) { Radigo.new(workdir, email, password) }
        it "executes radigo with credentials" do
          allow(radiko).to receive(:system)

          ret = radiko.rec(area, id, start)

          expect(ret).to eq("/tmp/20201122010000-TBS.aac")
          expect(radiko).to have_received(:system).with("rm -f /tmp/20201122010000-TBS.aac").ordered
          expect(radiko).to have_received(:system).with("env RADIGO_HOME=/tmp RADIKO_MAIL=test@radicaster.test RADIKO_PASSWORD=password radigo rec -area=JP13 -id=TBS -s=20201122010000", exception: true).ordered
        end
      end
    end
  end
end
