// jest.mock はモジュールトップレベルで宣言する必要がある
jest.mock('../../src/cleanup_episodes/s3');

import { S3Storage } from '../../src/cleanup_episodes/s3';
import { handler } from '../../src/cleanup_episodes/handler';

// handler.ts がモジュールロード時に new S3Storage() するため、
// プロトタイプのメソッドをモックして既存インスタンスから参照させる
const mockFindDefinition = S3Storage.prototype.findDefinition as jest.Mock;
const mockListEpisodes = S3Storage.prototype.listEpisodes as jest.Mock;
const mockDeleteEpisode = S3Storage.prototype.deleteEpisode as jest.Mock;

const ID = 'dummy-program-id';

// S3イベント（SNSラップなし）を生成するヘルパー
function makeS3Event(key: string) {
  return {
    Records: [
      {
        s3: {
          object: { key },
        },
      },
    ],
  };
}

// SNSにラップされたS3イベントを生成するヘルパー
function makeSnsWrappedEvent(key: string) {
  return {
    Records: [
      {
        Sns: {
          Message: JSON.stringify(makeS3Event(key)),
        },
      },
    ],
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.RADICASTER_S3_BUCKET = 'dummy-bucket';
});

describe('handler', () => {
  it('定義ファイルが存在しない場合はスキップする', async () => {
    mockFindDefinition.mockResolvedValueOnce(null);

    await handler(makeS3Event(`${ID}/data/20210101.m4a`));

    expect(mockListEpisodes).not.toHaveBeenCalled();
    expect(mockDeleteEpisode).not.toHaveBeenCalled();
  });

  it('retention_typeが設定されていない場合はスキップする', async () => {
    mockFindDefinition.mockResolvedValueOnce({ title: 'dummy' });

    await handler(makeS3Event(`${ID}/data/20210101.m4a`));

    expect(mockListEpisodes).not.toHaveBeenCalled();
    expect(mockDeleteEpisode).not.toHaveBeenCalled();
  });

  it('retention_type=countで古いエピソードを削除する', async () => {
    mockFindDefinition.mockResolvedValueOnce({ retention_type: 'count', retention_value: 2 });
    mockListEpisodes.mockResolvedValueOnce([
      { key: `${ID}/data/20210101.m4a` },
      { key: `${ID}/data/20210102.m4a` },
      { key: `${ID}/data/20210103.m4a` },
    ]);
    mockDeleteEpisode.mockResolvedValue(undefined);

    await handler(makeS3Event(`${ID}/data/20210103.m4a`));

    expect(mockDeleteEpisode).toHaveBeenCalledTimes(1);
    expect(mockDeleteEpisode).toHaveBeenCalledWith(`${ID}/data/20210101.m4a`);
  });

  it('retention_type=countでエピソード数が保持数以下の場合は削除しない', async () => {
    mockFindDefinition.mockResolvedValueOnce({ retention_type: 'count', retention_value: 5 });
    mockListEpisodes.mockResolvedValueOnce([
      { key: `${ID}/data/20210101.m4a` },
      { key: `${ID}/data/20210102.m4a` },
    ]);

    await handler(makeS3Event(`${ID}/data/20210102.m4a`));

    expect(mockDeleteEpisode).not.toHaveBeenCalled();
  });

  it('retention_type=daysで期限切れのエピソードを削除する', async () => {
    mockFindDefinition.mockResolvedValueOnce({ retention_type: 'days', retention_value: 7 });
    // 過去のエピソード（削除対象）と遠い未来のエピソード（保持）
    const oldKey = `${ID}/data/20200101.m4a`;
    const newKey = `${ID}/data/20991231.m4a`;
    mockListEpisodes.mockResolvedValueOnce([{ key: oldKey }, { key: newKey }]);
    mockDeleteEpisode.mockResolvedValue(undefined);

    await handler(makeS3Event(`${ID}/data/20991231.m4a`));

    expect(mockDeleteEpisode).toHaveBeenCalledTimes(1);
    expect(mockDeleteEpisode).toHaveBeenCalledWith(oldKey);
  });

  it('SNSにラップされたS3イベントを正しく処理する', async () => {
    mockFindDefinition.mockResolvedValueOnce(null);

    await handler(makeSnsWrappedEvent(`${ID}/data/20210101.m4a`));

    expect(mockFindDefinition).toHaveBeenCalledWith(ID);
  });

  it('URLエンコードされたS3キーを正しくデコードする', async () => {
    const encodedId = 'program%2Bid';
    const decodedId = 'program+id';
    mockFindDefinition.mockResolvedValueOnce(null);

    await handler(makeS3Event(`${encodedId}/data/20210101.m4a`));

    expect(mockFindDefinition).toHaveBeenCalledWith(decodedId);
  });

  it('unknown retention_typeの場合はスキップする', async () => {
    mockFindDefinition.mockResolvedValueOnce({ retention_type: 'unknown', retention_value: 5 });

    await handler(makeS3Event(`${ID}/data/20210101.m4a`));

    expect(mockDeleteEpisode).not.toHaveBeenCalled();
  });
});
