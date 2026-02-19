/** Podcastの定義 */
export interface Definition {
  title: string;
  author?: string;
  summary?: string;
  image?: string;
}

/** Podcastのエピソード（音声ファイル） */
export interface Episode {
  url: string;
  size: number;
  lastModified: Date;
  title: string;
}
