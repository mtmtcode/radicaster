import { S3Client } from '@aws-sdk/client-s3';
import { S3Storage } from '../../src/cleanup_episodes/s3';

const mockSend = jest.fn();
const mockClient = { send: mockSend } as unknown as S3Client;

const BUCKET = 'dummy-bucket';
const ID = 'dummy-program-id';

beforeEach(() => {
  mockSend.mockReset();
});

describe('S3Storage#findDefinition', () => {
  it('定義ファイルを読み込んでDefinitionオブジェクトを返す', async () => {
    const defBody = `title: dummy-title
retention_type: count
retention_value: 5
`;
    mockSend.mockResolvedValueOnce({ Body: { transformToString: async () => defBody } });

    const storage = new S3Storage(mockClient, BUCKET);
    const definition = await storage.findDefinition(ID);

    expect(definition).not.toBeNull();
    expect(definition!.retention_type).toBe('count');
    expect(definition!.retention_value).toBe(5);

    const callInput = mockSend.mock.calls[0][0].input;
    expect(callInput).toEqual({ Bucket: BUCKET, Key: `radicaster/${ID}.yaml` });
  });

  it('定義ファイルが存在しない場合はnullを返す', async () => {
    const noSuchKey = Object.assign(new Error('NoSuchKey'), { name: 'NoSuchKey' });
    mockSend.mockRejectedValueOnce(noSuchKey);

    const storage = new S3Storage(mockClient, BUCKET);
    const definition = await storage.findDefinition(ID);

    expect(definition).toBeNull();
  });
});

describe('S3Storage#listEpisodes', () => {
  it('m4aファイルのみ抽出してキーの昇順で返す', async () => {
    const ep1Key = `${ID}/data/20210101.m4a`;
    const ep2Key = `${ID}/data/20210102.m4a`;
    const nonAudioKey = `${ID}/data/20210101.txt`;

    mockSend.mockResolvedValueOnce({
      Contents: [
        { Key: ep2Key },
        { Key: ep1Key },
        { Key: nonAudioKey },
      ],
    });

    const storage = new S3Storage(mockClient, BUCKET);
    const episodes = await storage.listEpisodes(ID);

    expect(episodes.map(ep => ep.key)).toEqual([ep1Key, ep2Key]);

    const callInput = mockSend.mock.calls[0][0].input;
    expect(callInput).toEqual({ Bucket: BUCKET, Prefix: `${ID}/data/` });
  });

  it('エピソードが存在しない場合は空配列を返す', async () => {
    mockSend.mockResolvedValueOnce({ Contents: [] });

    const storage = new S3Storage(mockClient, BUCKET);
    const episodes = await storage.listEpisodes(ID);

    expect(episodes).toEqual([]);
  });
});

describe('S3Storage#deleteEpisode', () => {
  it('指定されたキーのオブジェクトを削除する', async () => {
    mockSend.mockResolvedValueOnce({});

    const storage = new S3Storage(mockClient, BUCKET);
    await storage.deleteEpisode(`${ID}/data/20210101.m4a`);

    const callInput = mockSend.mock.calls[0][0].input;
    expect(callInput).toEqual({ Bucket: BUCKET, Key: `${ID}/data/20210101.m4a` });
  });
});
