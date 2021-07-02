**Please do not use this project for commercial use. Only for your personal, non-commercial use.**</br>
**個人での視聴の目的以外で利用しないでください.**

# radicaster

radicasterはAWSの各種マネージサービスを活用し、radikoのお好きな番組を録音・Podcast化するアプリケーションです。

## 特徴

- FaaSを活用したアーキテクチャにより低コストで運用可能
    - 普通の使い方であればストレージ以外はほぼ無料
- AWS CDKによる簡単なデプロイ
- 分割された番組の結合に対応
- HTTPS+Basic認証によるフィードの保護
- 独自ドメインを使用可能

## 構成

![](./radicaster.png)

### 主な使用サービス

- Lambda
- EventBridge
- S3
- CloudFront

## デプロイ

TODO

## 利用方法

### 定義ファイルを作成する

以下のフォーマットで、Podcast化したい番組の情報を記述します。

```yaml
id: example                                       # 番組ID: 番組を一意に識別する文字列で、AWSの各種リソースの命名やURLなどに使用されます
title: テスト番組                                   # 番組名: 生成されるPodcastフィードの番組名に使用されます
author: テスト太郎                                  # 作者: 生成されるPodcastの作者フィールドに使用されます
image: http://www.tbsradio.jp/ijuin/300_300.jpg   # 画像: Podcastの番組サムネイルに使用する画像のURLを指定します
area: JP13                                        # エリアID: 録音対象のradikoのエリアIDを指定します。デプロイ時にradikoプレミアムの認証情報を指定しない場合はJP13のみ指定できます。
station: TBS                                      # 放送局: 録音対象の放送局を指定します
program_schedule: Tue 01:00:00                    # 番組開始日時: 録音対象番組の放送開始曜日と時間を指定します
execution_schedule: Tue 03:03:00                  # 録音開始日時: 録音を実行する曜日と日時を指定します
```

### 録音を予約する

環境変数 AWS_PROFILE に、デプロイを実行したプロファイルがセットされている状態で以下のコマンドを実行します。

```
$ cd cli
$ ./bin/radicaster example.yaml
```

上記のコマンドを実行すると、定義ファイルの内容に基づいて以下の処理が行われます。

- 録音ファイル出力先のS3バケットに定義ファイルをアップロード
- EventBridge へ録音の定期実行ルールを登録

### フィードを購読

デプロイが正常に行われていれば、最初の録音が行われた後に所定のURLにPodcastのフィードが生成されるので、お好みのPodcastアプリでフィードを購読します。

以上で作業は完了です。スケジュールに従って録音が行われる度に、新しいエピソードがフィードに追加されていきます。


(TODO) Basic認証が必要なフィードの購読について
