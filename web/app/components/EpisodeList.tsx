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
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSavedTimeRef = useRef(0);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [currentEpisodeIndex]);

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

  const togglePlay = (index: number) => {
    if (currentEpisodeIndex === index) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentEpisodeIndex(index);
      // isPlaying logic is handled by onPlay event of the new audio element
    }
  };

  const currentEpisodeData = currentEpisodeIndex !== null ? feed?.items[currentEpisodeIndex] : null;

  // Auto-play when source changes if it was user initiated
  // We don't need this useEffect anymore because we play via autoPlay attribute on new audio element
  // or via manual play() call.
  // Actually, let's keep it simple. The <audio autoPlay> handles the start.
  // But if we pause and play heavily, sometimes autoPlay is blocked.
  // But for now let's rely on standard currentEpisodeIndex change remounting component.


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
        {feed.items.map((episode, index) => {
          const isCurrent = currentEpisodeIndex === index;
          return (
            <div
              key={index}
              className={cn(
                "group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border-2 transition-all",
                isCurrent ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200"
              )}
            >
              <button
                onClick={() => togglePlay(index)}
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
                <div className="w-full mt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4">
                    {/* Controls & Time */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (audioRef.current) audioRef.current.currentTime -= 15;
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                        title="15秒戻る"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>

                      <div className="text-sm font-medium tabular-nums text-gray-700">
                        {(() => {
                          const m = Math.floor(currentTime / 60);
                          const s = Math.floor(currentTime % 60);
                          return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                        })()}
                      </div>

                      <button
                        onClick={() => {
                          if (audioRef.current) audioRef.current.currentTime += 30;
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                        title="30秒進む"
                      >
                        <RotateCw className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Seek Bar */}
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={(e) => {
                        const newTime = Number(e.target.value);
                        if (audioRef.current) {
                          audioRef.current.currentTime = newTime;
                        }
                        setCurrentTime(newTime);
                      }}
                      className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />

                    {/* Volume Control */}
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-gray-500" />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        onChange={(e) => {
                          const newVolume = Number(e.target.value);
                          setVolume(newVolume);
                          if (audioRef.current) {
                            audioRef.current.volume = newVolume;
                          }
                        }}
                        className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        title="音量"
                      />
                    </div>
                  </div>

                  <audio
                    ref={audioRef}
                    key={index}
                    src={episode.enclosure?.url}
                    autoPlay
                    className="hidden"
                    onPlay={() => setIsPlaying(true)}
                    onPause={(e) => {
                      setIsPlaying(false);
                      // Save position on pause
                      const time = e.currentTarget.currentTime;
                      localStorage.setItem(`radicaster-playback-${episode.guid}`, time.toString());
                    }}
                    onEnded={() => {
                      setIsPlaying(false);
                      // Clear position on end (optional, but usually good)
                      localStorage.removeItem(`radicaster-playback-${episode.guid}`);
                    }}
                    onTimeUpdate={(e) => {
                      const time = e.currentTarget.currentTime;
                      setCurrentTime(time);

                      // Save position every 5 seconds
                      if (Math.abs(time - lastSavedTimeRef.current) > 5) {
                        localStorage.setItem(`radicaster-playback-${episode.guid}`, time.toString());
                        lastSavedTimeRef.current = time;
                      }
                    }}
                    onLoadedMetadata={(e) => {
                      setDuration(e.currentTarget.duration);
                      e.currentTarget.volume = volume;

                      // Restore position if available
                      const savedTime = localStorage.getItem(`radicaster-playback-${episode.guid}`);
                      if (savedTime) {
                        const time = parseFloat(savedTime);
                        if (!isNaN(time) && time > 0 && time < e.currentTarget.duration) {
                          e.currentTarget.currentTime = time;
                          setCurrentTime(time);
                          lastSavedTimeRef.current = time;
                        }
                      }
                    }}
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
