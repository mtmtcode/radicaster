"use client";

import { useEffect, useState, useRef } from "react";
import { Play, Pause, Calendar, Clock, Volume2, AlertCircle, RotateCcw, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Episode {
  title: string;
  description: string;
  pubDate: string;
  link: string;
  enclosure: {
    url: string;
    length: string;
    type: string;
  } | null;
  duration?: string;
  guid: string;
}

interface FeedData {
  title: string;
  description: string;
  items: Episode[];
}

export function EpisodeList({ id }: { id: string }) {
  const [feed, setFeed] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<string | null>(null); // guid
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function fetchFeed() {
      try {
        setLoading(true);
        const res = await fetch(`/api/recordings/${id}/feed`);
        if (!res.ok) throw new Error("Failed to fetch feed");
        const data = await res.json();
        setFeed(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, [id]);

  const togglePlay = (episode: Episode) => {
    if (currentEpisode === episode.guid) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentEpisode(episode.guid);
      setIsPlaying(true); // Don't set true immediately until load? No, standard html audio behaves well.

      // We need to wait for render to update the audio src? 
      // Actually standard way is to have one audio element and switch src, 
      // or have render one audio element for current episode.
    }
  };

  const currentEpisodeData = feed?.items.find(i => i.guid === currentEpisode);

  // Auto-play when source changes if it was user initiated
  useEffect(() => {
    if (currentEpisode && isPlaying && audioRef.current) {
      // If the source changes, we might need to call play()
      // But if we render a new audio element with autoPlay, it works.
      // Let's rely on the `autoPlay` attribute for new episodes, 
      // and manual control for pause/resume.
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Auto-play prevented:", error);
          setIsPlaying(false);
        });
      }
    }
  }, [currentEpisode]);


  if (loading) return <div className="text-center p-8 text-gray-500">Loading episodes...</div>;
  if (error) return <div className="text-center p-8 text-red-500 flex items-center justify-center gap-2"><AlertCircle className="w-5 h-5" /> Failed to load episodes</div>;
  if (!feed || !feed.items || feed.items.length === 0) return <div className="text-center p-8 text-gray-400">No episodes found.</div>;

  return (
    <section className="space-y-6">
      <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 border-b border-gray-100 pb-2">
        <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
          <Volume2 className="w-5 h-5" />
        </span>
        エピソード ({feed.items.length})
      </h3>

      <div className="space-y-3">
        {feed.items.map((episode) => {
          const isCurrent = currentEpisode === episode.guid;
          return (
            <div
              key={episode.guid}
              className={cn(
                "group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border-2 transition-all",
                isCurrent ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200"
              )}
            >
              <button
                onClick={() => togglePlay(episode)}
                className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  isCurrent ? "bg-primary text-white" : "bg-gray-100 text-gray-500 group-hover:bg-primary group-hover:text-white"
                )}
              >
                {isCurrent && isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <div className="flex-grow min-w-0">
                <h4 className={cn("font-bold text-base mb-1 truncate", isCurrent ? "text-primary" : "text-gray-800")}>
                  {episode.title}
                </h4>
                <div className="flex flex-wrap text-xs text-gray-500 gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(episode.pubDate).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {episode.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {episode.duration}
                    </span>
                  )}
                </div>
              </div>

              {/* Audio Player for this episode if it is active */}
              {isCurrent && (
                <div className="w-full sm:w-auto mt-2 sm:mt-0 flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (audioRef.current) audioRef.current.currentTime -= 10;
                      }}
                      className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors text-xs font-medium"
                      title="10秒戻る"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>15</span>
                    </button>
                    <button
                      onClick={() => {
                        if (audioRef.current) audioRef.current.currentTime += 30;
                      }}
                      className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors text-xs font-medium"
                      title="30秒進む"
                    >
                      <span>30</span>
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                  <audio
                    ref={audioRef}
                    src={episode.enclosure?.url}
                    controls
                    autoPlay
                    className="h-8 w-full sm:w-64"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
