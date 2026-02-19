import { generateFeed } from '../src/feedGenerator';
import { Definition, Episode } from '../src/types';

describe('generateFeed', () => {
  const definition: Definition = {
    title: 'dummy title',
    author: 'dummy author',
    summary: 'dummy summary',
    image: 'http://radicaster.test/dummy.png',
  };

  const episodes: Episode[] = [
    {
      url: 'http://radicaster.test/dummy/20210102.m4a',
      size: 100,
      lastModified: new Date(Date.UTC(2021, 0, 2)),
      title: '20210102.m4a',
    },
    {
      url: 'http://radicaster.test/dummy/20210101.m4a',
      size: 100,
      lastModified: new Date(Date.UTC(2021, 0, 1)),
      title: '20210101.m4a',
    },
  ];

  it('RSSフィードのヘッダを生成する', () => {
    const feed = generateFeed(definition, episodes);
    expect(feed).toContain('<?xml version="1.0" encoding="UTF-8" ?>');
    expect(feed).toContain('xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"');
    expect(feed).toContain('<title>dummy title</title>');
    expect(feed).toContain('<itunes:author>dummy author</itunes:author>');
    expect(feed).toContain('<itunes:summary>dummy summary</itunes:summary>');
    expect(feed).toContain('<itunes:image href="http://radicaster.test/dummy.png"/>');
  });

  it('エピソードごとにアイテムを生成する', () => {
    const feed = generateFeed(definition, episodes);
    expect(feed).toContain('<title>20210102.m4a</title>');
    expect(feed).toContain('<title>20210101.m4a</title>');
    expect(feed).toContain(
      '<enclosure url="http://radicaster.test/dummy/20210102.m4a" length="100" type="audio/mp4; charset=binary"/>',
    );
    expect(feed).toContain(
      '<enclosure url="http://radicaster.test/dummy/20210101.m4a" length="100" type="audio/mp4; charset=binary"/>',
    );
  });

  it('日付をRFC822形式でフォーマットする', () => {
    const feed = generateFeed(definition, episodes);
    expect(feed).toContain('Sat, 02 Jan 2021 00:00:00');
    expect(feed).toContain('Fri, 01 Jan 2021 00:00:00');
  });

  it('imageがない場合はitunes:imageタグを出力しない', () => {
    const defWithoutImage: Definition = { ...definition, image: undefined };
    const feed = generateFeed(defWithoutImage, episodes);
    expect(feed).not.toContain('<itunes:image');
  });

  it('エピソードが渡された順で出力される', () => {
    const feed = generateFeed(definition, episodes);
    const idx1 = feed.indexOf('20210102.m4a');
    const idx2 = feed.indexOf('20210101.m4a');
    expect(idx1).toBeLessThan(idx2);
  });
});
