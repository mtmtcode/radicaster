import { S3Client } from '@aws-sdk/client-s3';
import { S3Storage } from '../../src/gen_feed/s3';

const mockSend = jest.fn();
const mockClient = { send: mockSend } as unknown as S3Client;

const BUCKET = 'dummy-bucket';
const URL_BASE = 'http://radicaster.test';
const ID = 'dummy-program-id';

beforeEach(() => {
  mockSend.mockReset();
});

describe('S3Storage#findDefinition', () => {
  it('定義ファイルを読み込んでDefinitionオブジェクトを返す', async () => {
    const defBody = `title: dummy-title
author: dummy-author
summary: dummy-summary
image: http://foo.test/bar.png
`;

    // GetObjectCommand (YAML取得) → ListObjectsV2Command (画像検索、空リスト)
    mockSend
      .mockResolvedValueOnce({ Body: { transformToString: async () => defBody } })
      .mockResolvedValueOnce({ Contents: [] });

    const storage = new S3Storage(mockClient, BUCKET, URL_BASE);
    const definition = await storage.findDefinition(ID);

    expect(definition.title).toBe('dummy-title');
    expect(definition.author).toBe('dummy-author');
    expect(definition.summary).toBe('dummy-summary');
    // 画像が見つからない場合はYAMLのimage値を使用する
    expect(definition.image).toBe('http://foo.test/bar.png');

    const firstCallInput = mockSend.mock.calls[0][0].input;
    expect(firstCallInput).toEqual({ Bucket: BUCKET, Key: `radicaster/${ID}.yaml` });
  });

  it('URLにクレデンシャルが含まれる場合、画像URLにはクレデンシャルを含めない', async () => {
    const defBody = `title: dummy-title
author: dummy-author
summary: dummy-summary
`;
    const urlWithCreds = 'http://user:pass@radicaster.test';

    // GetObjectCommand → ListObjectsV2Command (画像あり)
    mockSend
      .mockResolvedValueOnce({ Body: { transformToString: async () => defBody } })
      .mockResolvedValueOnce({
        Contents: [{ Key: `radicaster/${ID}.png`, Size: 100, LastModified: new Date() }],
      });

    const storage = new S3Storage(mockClient, BUCKET, urlWithCreds);
    const definition = await storage.findDefinition(ID);

    expect(definition.image).toBe(`http://radicaster.test/radicaster/${ID}.png`);
    expect(definition.image).not.toContain('user:pass');
  });
});

describe('S3Storage#listEpisodes', () => {
  it('音声ファイルのみ抽出してEpisodeの配列をタイトル降順で返す', async () => {
    const ep1Key = `${ID}/data/20210101.m4a`;
    const ep2Key = `${ID}/data/20210102.m4a`;
    const nonAudioKey = `${ID}/data/20210101.txt`;

    mockSend.mockResolvedValueOnce({
      Contents: [
        { Key: ep1Key, Size: 100, LastModified: new Date('2021-01-01') },
        { Key: ep2Key, Size: 200, LastModified: new Date('2021-01-02') },
        { Key: nonAudioKey, Size: 50, LastModified: new Date('2021-01-01') },
      ],
    });

    const storage = new S3Storage(mockClient, BUCKET, URL_BASE);
    const episodes = await storage.listEpisodes(ID);

    expect(episodes.map(ep => ep.title)).toEqual(['20210102.m4a', '20210101.m4a']);

    const callInput = mockSend.mock.calls[0][0].input;
    expect(callInput).toEqual({ Bucket: BUCKET, Prefix: `${ID}/data/` });
  });
});

describe('S3Storage#saveFeed', () => {
  it('適切なキーとメタデータでフィードをアップロードする', async () => {
    mockSend.mockResolvedValueOnce({});

    const storage = new S3Storage(mockClient, BUCKET, URL_BASE);
    await storage.saveFeed(ID, 'feed_body');

    const callInput = mockSend.mock.calls[0][0].input;
    expect(callInput).toEqual({
      Bucket: BUCKET,
      Key: `${ID}/index.rss`,
      Body: 'feed_body',
      ContentType: 'application/rss+xml',
      CacheControl: 'no-cache',
    });
  });
});
