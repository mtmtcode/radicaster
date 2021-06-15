**Please do not use this project for commercial use. Only for your personal, non-commercial use.**</br>
**個人での視聴の目的以外で利用しないでください.**

# radicaster

radicasterは、AWS上で動作するradikoを録音・Podcast化するアプリケーションです。

## 特徴

- マネージドサービスを活用したアーキテクチャにより低コストで運用可能
- AWS CDKによる簡単なデプロイ
- 分割された番組の結合に対応

## 構成

![](./radicaster.png)

### 主な使用サービス

- Lambda
- EventBridge
- S3
- CloudFront

## TODO

- 録音対象番組情報の受け渡し方法変更
- 環境固有の情報をCDKのcontextで受け取る
- 利用方法のドキュメント書く
- GitHub ActionsでCI

## 利用方法

TODO
