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

## デプロイ方法

### 事前準備

#### リポジトリのclone

```bash
git@github.com:l3msh0/radicaster.git
```

#### AWSプロファイルの準備

デプロイに使用するAWSアカウントやリージョンは、 `AWS_ACCESS_KEY_ID` や `AWS_REGION` などの環境変数でも指定できますがプロファイルを使用することを推奨します。

プロファイルの設定を行い、後続の作業は環境変数 `AWS_PROFILE` にプロファイル名をセットした上で実行してください。

#### AWS CDKのインストール

デプロイにはAWS CDKを使用します。以下のコマンドを実行しでCDKをインストールしてください。

```bash
npm install -g aws-cdk
```

AWS CDKについての詳細は[AWSのドキュメント](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html)を参照してください。

#### CDK bootstrap

CDKによるデプロイを行うにあたって、事前にbootstrapという作業が必要となります。
以下のコマンドを実行してbootstrapを行ってください。Basic認証のためにLambda@Edgeを使用すつ都合でus-east-1リージョンもbootstrapが必要です。

```bash
cdk bootstrap aws://<AWSのアカウントID>/us-east-1 aws://<AWSのアカウントID>/ap-northeast-1
```

参考
- [Bootstrapping - AWS Cloud Development Kit (CDK)](https://docs.aws.amazon.com/cdk/latest/guide/bootstrapping.html)

### 環境変数の準備

cloneしたリポジトリ直下にある `.env.example` ファイルをコピーし、コメントに従って必要な値を入力します。
`RADICASTER_REC_RADIKO_ARN` については、CDKを実行してリソースを作成されないと記入できないためこの時点では無視してください。

```bash
cp .env.example .env
vim .env
```

一通り入力ができたら、sourceコマンドでファイルに記載された環境変数を現在のシェルにセットします。

```bash
source .env
```

### CDK実行

CDKを実行し、AWS上にradicasterが使用するリソースを作成します。

```bash
export AWS_PROFILE=AWSプロファイル名
cd deployment
cdk deploy --all
```

### 環境変数の更新

CDKを実行すると実行結果のOutputsが出力されます。その中から `RadicasterStack.RecRadikoARN` の値をコピーし、.envの `RADICASTER_REC_RADIKO_ARN` の値にセットしてください。

CDK実行結果の例
```
Outputs:
RadicasterStack.RecRadikoARN = arn:aws:lambda:ap-northeast-1:xxxxxxxxxxxx:function:radicaster-rec-radiko
RadicasterStack.domainName = https://xxxxxxxxxxxxxx.cloudfront.net
```

以上でリソースの作成は完了です。

## 録音方法

radicasterでは、録音したい番組の情報を定義しCLIで処理することで、AWS EventBridgeに録音用Lambdaの実行をスケジュールします。

### 依存パッケージのインストール

```
cd cli
bundle install
```

### 定義ファイルを作成する

以下のフォーマットで、Podcast化したい番組の情報を記述します。

```yaml
id: example                                       # 番組ID: 番組を一意に識別する文字列で、AWSの各種リソースの命名やURLなどに使用されます
title: テスト番組                                   # 番組名: 生成されるPodcastフィードの番組名に使用されます
author: テスト太郎                                  # 作者: 生成されるPodcastの作者フィールドに使用されます
image: http://example.com/cover.png               # 画像: Podcastの番組サムネイルに使用する画像のURLを指定します
area: JP13                                        # エリアID: 録音対象のradikoのエリアIDを指定します。デプロイ時にradikoプレミアムの認証情報を指定しない場合はJP13のみ指定できます。
station: TEST                                     # 放送局: 録音対象の放送局を指定します
program_schedule: Tue 01:00:00                    # 番組開始日時: 録音対象番組の放送開始曜日と時間を日本時間で指定します
execution_schedule: Tue 03:03:00                  # 録音開始日時: 録音処理を実行する曜日と日時を日本時間で指定します。録音処理は番組の放送が終了してから実行してください。
```

#### Tips: 番組の連結、複数曜日の指定

定義ファイルの `program_schedule` と `execution_schedule` を配列にすることで複数曜日に放送される番組の録音ができます。さらに二次元配列にすることで、放送時間が長く分割された番組を1エピソードとして連結することができます。

例. 月〜木曜の 8:30-10:00, 10:00-11:00 に分割された番組を録音予約する例

```yaml
id: example
title: テスト番組
author: テスト太郎
image: http://example.com/cover.png
area: JP13
station: TEST
program_schedule:
- ["Mon 08:30:00", "Mon 10:00:00"]
- ["Tue 08:30:00", "Tue 10:00:00"]
- ["Wed 08:30:00", "Wed 10:00:00"]
- ["Thu 08:30:00", "Thu 10:00:00"]
execution_schedule:
- Mon 12:00:00
- Tue 12:00:00
- Wed 12:00:00
- Thu 12:00:00
```

録音処理では直近の1エピソードのみを対象として録音を行います。例えば火曜12:00に起動する処理で録音されるのは `["Tue 08:30:00", "Tue 10:00:00"]` のエピソードのみです。したがって、複数曜日の番組を録音する場合は上記の例のように `execution_schedule` も各曜日分指定してください。


### 録音を予約する

.envに記載した環境変数を読み込んだ上で、CLIを実行します。`AWS_PROFILE`など、AWSアカウントの認証情報やリージョンを特定する環境変数も忘れずにセットしておいてください。

```
source .env
cd cli
./bin/radicaster example.yaml
```

上記のコマンドを実行すると、定義ファイルの内容に基づいて以下の処理が行われます。

- 録音ファイル出力先のS3バケットに定義ファイルをアップロード
- EventBridge へ録音の定期実行ルールを登録

## フィードの購読

初回の録音が完了するとPodcastのフィードが生成され購読できる状態になりますので、お好みのPodcastアプリでフィードを購読してください。（TODO: 初回録音完了前にフィードを購読できる状態にする）

フィードのURLは `https://(CDK実行時に表示されたドメイン名)/(定義ファイルに記載したID)/` の形式です。（e.g. https://xxxxxxxxxxxxxx.cloudfront.net/test/)

### Basic認証付きフィード

radicasterは著作権保護のためPodcastフィードをBasic認証で保護します。このため、Podcastアプリでフィードを購読する際は認証情報を指定する必要があります。

認証情報の入力方法はアプリによって異なりますが、認証情報の入力欄がない場合は `https://ユーザ名:パスワード@example.com/` のようにURLに認証情報を含めることで認証付きフィードを購読できることが多いです。（Apple Podcastなど）
