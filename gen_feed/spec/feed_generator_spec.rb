module Radicaster::GenFeed
  describe FeedGenerator do
    subject(:generator) { FeedGenerator.new }

    describe "#generate" do
      let(:definition) { Definition.new(title: "dummy title", author: "dummy author", summary: "dummy summary", image: "http://radicaster.test/dummy.png") }
      let(:episodes) {
        [
          Episode.new(url: "http://radicaster.test/dummy/20210102.m4a", size: 100, last_modified: Time.utc(2021, 1, 2)),
          Episode.new(url: "http://radicaster.test/dummy/20210101.m4a", size: 100, last_modified: Time.utc(2021, 1, 1)),
        ]
      }

      it "generates podcast feed" do
        feed = generator.generate(definition, episodes)
        expected = <<~EOS
          <?xml version="1.0" encoding="UTF-8" ?>
          <rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
            <channel>
              <title>dummy title</title>
              <itunes:author>dummy author</itunes:author>
              <itunes:summary>dummy summary</itunes:summary>
              
              <itunes:image href="http://radicaster.test/dummy.png"/>
              
              
              <item>
                <title>20210102.m4a</title>
                <itunes:author>dummy author</itunes:author>
                
                <itunes:image href="http://radicaster.test/dummy.png"/>
                
                <pubDate>Sat, 02 Jan 2021 00:00:00 -0000</pubDate>
                <enclosure url="http://radicaster.test/dummy/20210102.m4a" length="100" type="audio/mp4; charset=binary"/>
              </item>
              
              <item>
                <title>20210101.m4a</title>
                <itunes:author>dummy author</itunes:author>
                
                <itunes:image href="http://radicaster.test/dummy.png"/>
                
                <pubDate>Fri, 01 Jan 2021 00:00:00 -0000</pubDate>
                <enclosure url="http://radicaster.test/dummy/20210101.m4a" length="100" type="audio/mp4; charset=binary"/>
              </item>
              
            </channel>
          </rss>
        EOS
        expect(feed).to eq(expected)
      end
    end
  end
end
