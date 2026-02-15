"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Search, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Recording {
  id: string;
  status: "healthy" | "s3_only" | "eventbridge_only" | "error";
  schedules: string[];
  title?: string;
  station?: string;
  imageUrl?: string;
}

export default function RecordingsList() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecordings() {
      try {
        const res = await fetch("/api/recordings");
        if (!res.ok) throw new Error("Failed to fetch recordings");
        const data = await res.json();
        setRecordings(data.recordings || []);
      } catch (err) {
        setError("録音リストの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecordings();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Section with Search Style Input (Mock) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          href="/recordings/new"
          className="pop-button inline-flex items-center px-6 py-3 rounded-full shadow-lg shadow-primary/20 text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          新規予約を作成
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
          <p className="mt-4 text-gray-400 font-medium animate-pulse">読み込み中...</p>
        </div>
      ) : recordings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-900 font-bold text-lg">録音スケジュールがありません</p>
          <p className="text-gray-500 text-sm mt-1 mb-6">新しい番組を登録して録音を開始しましょう</p>
          <Link href="/recordings/new" className="text-primary font-bold hover:underline inline-block">
            はじめての予約を作成する &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {recordings.map((recording) => (
            <Link
              key={recording.id}
              href={`/recordings/${recording.id}`}
              className="group flex flex-col pop-button"
            >
              <div className="aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 relative mb-3 shadow-sm group-hover:shadow-xl group-hover:shadow-primary/10 transition-all duration-300 ring-4 ring-transparent group-hover:ring-primary/10">
                {recording.imageUrl ? (
                  <img
                    src={recording.imageUrl}
                    alt={recording.title || recording.id}
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-4 text-center">
                    <span className="font-bold text-2xl text-gray-200 select-none">No Image</span>
                  </div>
                )}

                {/* Status Indicator */}
                <div className="absolute top-3 right-3">
                  <span className={cn(
                    "relative flex h-3 w-3",
                    recording.status === 'healthy' ? "text-emerald-500" :
                      recording.status === 'error' ? "text-red-500" : "text-amber-500"
                  )}>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-current ring-2 ring-white"></span>
                  </span>
                </div>
              </div>

              <div className="space-y-1 px-1">
                <h3 className="text-sm font-bold text-slate-700 line-clamp-1 group-hover:text-primary transition-colors">
                  {recording.title || recording.id}
                </h3>
                {recording.station && (
                  <p className="text-xs text-gray-400 font-medium truncate">
                    {recording.station}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
