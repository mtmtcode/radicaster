"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, XCircle } from "lucide-react";

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
        setError("Failed to load recordings");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecordings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-black p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recordings</h1>
          </div>
          <Link
            href="/recordings/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Recording
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-900 border-t-transparent"></div>
            <p className="mt-2 text-gray-500">Loading recordings...</p>
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
            <p className="text-gray-500">No recordings found.</p>
            <Link href="/recordings/new" className="text-gray-900 hover:underline mt-2 inline-block">
              Create your first recording
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {recordings.map((recording) => (
              <Link
                key={recording.id}
                href={`/recordings/${recording.id}`}
                className="group flex flex-col"
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 relative mb-2 shadow-sm transition-shadow group-hover:shadow-md">
                  {recording.imageUrl ? (
                    <img
                      src={recording.imageUrl}
                      alt={recording.title || recording.id}
                      className="h-full w-full object-cover object-center group-hover:opacity-90 transition-opacity duration-300"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <span className="text-xs">No Image</span>
                    </div>
                  )}
                  {/* Status Indicator Dot */}
                  <div className={`absolute top-2 right-2 h-3 w-3 rounded-full border-2 border-white ${recording.status === 'healthy' ? 'bg-blue-500' :
                    recording.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                </div>
                <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-gray-600">
                  {recording.title || recording.id}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
