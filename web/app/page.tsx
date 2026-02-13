"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Recording {
  id: string;
  status: "healthy" | "s3_only" | "eventbridge_only" | "error";
  schedules: string[];
  title?: string;
  station?: string;
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
    <div className="min-h-screen bg-gray-50 text-black p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recordings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your recording schedules and monitor their status.
            </p>
          </div>
          <Link
            href="/recordings/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-500">Loading recordings...</p>
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No recordings found.</p>
            <Link href="/recordings/new" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
              Create your first recording
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {recordings.map((recording) => (
                <li key={recording.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0 mr-4">
                        {recording.status === "healthy" ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : recording.status === "s3_only" ? (
                          <div title="Missing EventBridge Rule">
                            <AlertTriangle className="h-6 w-6 text-yellow-500" />
                          </div>
                        ) : (
                          <div title="Missing S3 Definition">
                            <AlertTriangle className="h-6 w-6 text-red-500" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-indigo-600 truncate">{recording.title || recording.id}</p>
                        <p className="text-sm text-gray-500 truncate">{recording.id}</p>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className="flex flex-col items-end">
                        {recording.schedules.map((s, i) => (
                          <span key={i} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 mb-1">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
