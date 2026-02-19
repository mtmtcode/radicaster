/** 番組定義（YAMLから読み込む） */
export interface Definition {
  retention_type?: string;
  retention_value?: number;
}

/** エピソード（音声ファイル） */
export interface Episode {
  key: string;
}
