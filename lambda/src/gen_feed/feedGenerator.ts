import { Definition, Episode } from './types';

/** DateをRFC822形式に変換する */
function toRFC822(date: Date): string {
  // toUTCString() は "Sat, 02 Jan 2021 00:00:00 GMT" の形式を返す
  return date.toUTCString().replace('GMT', '-0000');
}

/** PodcastのRSSフィードを生成する */
export function generateFeed(definition: Definition, episodes: Episode[]): string {
  const imageTag = definition.image
    ? `\n    <itunes:image href="${definition.image}"/>`
    : '';

  const items = episodes.map(ep => {
    const itemImageTag = definition.image
      ? `\n      <itunes:image href="${definition.image}"/>`
      : '';
    return `    <item>
      <title>${ep.title}</title>
      <itunes:author>${definition.author ?? ''}</itunes:author>${itemImageTag}
      <pubDate>${toRFC822(ep.lastModified)}</pubDate>
      <enclosure url="${ep.url}" length="${ep.size}" type="audio/mp4; charset=binary"/>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel>
    <title>${definition.title}</title>
    <itunes:author>${definition.author ?? ''}</itunes:author>
    <itunes:summary>${definition.summary ?? ''}</itunes:summary>${imageTag}
${items}
  </channel>
</rss>`;
}
