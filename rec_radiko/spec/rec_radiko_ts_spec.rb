module Radicaster::RecRadiko
  describe RecRadikoTs do
    let(:workdir) { "/tmp" }

    describe "#initialize" do
      context "normal cases" do
        where(:email, :password) do
          [
            [nil, nil],
            ["test@radicaster.test", "password"],
          ]
        end

        with_them do
          it "does not raise error" do
            expect { RecRadikoTs.new(workdir, email, password) }.to_not raise_error
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
            expect { RecRadikoTs.new(workdir, email, password) }.to raise_error(RuntimeError)
          end
        end
      end
    end

    describe "#rec" do
      let(:area) { "JP13" }
      let(:id) { "TEST" }
      let(:start_time) { Time.new(2020, 11, 22, 1, 0, 0, "+09:00") }

      context "when credentials are not specified" do
        subject(:radiko) { RecRadikoTs.new(workdir) }
        it "executes rec_radiko_ts.sh without credentials" do
          allow(radiko).to receive(:system)

          ret = radiko.rec(area, id, start_time, 120)

          expect(ret).to eq("/tmp/20201122010000-TEST.m4a")
          expect(radiko).to have_received(:system).with(
            "rec_radiko_ts.sh -s TEST -f 20201122010000 -d 120 -o \"/tmp/20201122010000-TEST.m4a\"",
            exception: true
          )
        end
      end

      context "when credentials are specified" do
        let(:email) { "test@radicaster.test" }
        let(:password) { "password" }
        subject(:radiko) { RecRadikoTs.new(workdir, email, password) }
        it "executes rec_radiko_ts.sh with credentials" do
          allow(radiko).to receive(:system)

          ret = radiko.rec(area, id, start_time, 120)

          expect(ret).to eq("/tmp/20201122010000-TEST.m4a")
          expect(radiko).to have_received(:system).with(
            "rec_radiko_ts.sh -s TEST -f 20201122010000 -d 120 -o \"/tmp/20201122010000-TEST.m4a\" -m \"test@radicaster.test\" -p \"password\"",
            exception: true
          )
        end
      end
    end
  end
end
