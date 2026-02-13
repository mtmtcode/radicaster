"use client";

import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState } from "react";
import { ExecutionSchedulePicker } from "./components/ExecutionSchedulePicker";
import { BroadcastSchedulePicker } from "./components/BroadcastSchedulePicker";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const scheduleSchema = z.string().regex(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s*([0-5]?[0-9]):([0-5]?[0-9])(?::([0-5]?[0-9]))?$/i, {
  message: "Format must be 'Day HH:MM' (e.g., 'Mon 21:00')",
});

const formSchema = z.object({
  id: z.string().min(1, "ID is required").regex(/^[a-z0-9_-]+$/, "ID must be lowercase alphanumeric, dash, or underscore"),
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  image: z.string().url("Must be a valid URL").or(z.literal("")),
  area: z.string().min(1, "Area ID is required"),
  station: z.string().min(1, "Station ID is required"),
  program_schedule: z.array(z.string().min(1, "Schedule cannot be empty")),
  execution_schedule: z.array(scheduleSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      title: "",
      author: "",
      image: "",
      area: "JP13",
      station: "",
      program_schedule: [""],
      execution_schedule: [""],
    },
  });

  const { register, control, handleSubmit, formState: { errors } } = form;

  const { fields: programFields, append: appendProgram, remove: removeProgram } = useFieldArray({
    control,
    name: "program_schedule" as never, // Type assertion due to string array limitations in RHF
  });

  const { fields: executionFields, append: appendExecution, remove: removeExecution } = useFieldArray({
    control,
    name: "execution_schedule" as never,
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setResult(null);
    try {
      const response = await fetch("/api/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Failed to submit");
      }

      setResult({ success: true, message: `Successfully scheduled recording for ${json.id}` });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setResult({ success: false, message: error.message });
      } else {
        setResult({ success: false, message: "An unexpected error occurred" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-black">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Radicaster Recording Scheduler</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create a new recording schedule definition. This will generate a YAML file, upload it to S3, and register EventBridge rules.
          </p>
        </div>

        {result && (
          <div className={cn("p-4 mb-6 rounded-md", result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>
            {result.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-gray-700">ID</label>
              <p className="text-xs text-gray-500 mb-1">番組ID: 番組を一意に識別する文字列で、AWSの各種リソースの命名やURLなどに使用されます</p>
              <input
                type="text"
                id="id"
                {...register("id")}
                className={cn("mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border", errors.id && "border-red-500")}
                placeholder="my-radio-program"
              />
              {errors.id && <p className="mt-1 text-sm text-red-600">{errors.id.message}</p>}
            </div>

            <div>
              <label htmlFor="station" className="block text-sm font-medium text-gray-700">Station ID</label>
              <p className="text-xs text-gray-500 mb-1">放送局: 録音対象の放送局を指定します</p>
              <input
                type="text"
                id="station"
                {...register("station")}
                className={cn("mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border", errors.station && "border-red-500")}
                placeholder="TBS"
              />
              {errors.station && <p className="mt-1 text-sm text-red-600">{errors.station.message}</p>}
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <p className="text-xs text-gray-500 mb-1">番組名: 生成されるPodcastフィードの番組名に使用されます</p>
              <input
                type="text"
                id="title"
                {...register("title")}
                className={cn("mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border", errors.title && "border-red-500")}
                placeholder="Program Title"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700">Author</label>
              <p className="text-xs text-gray-500 mb-1">作者: 生成されるPodcastの作者フィールドに使用されます</p>
              <input
                type="text"
                id="author"
                {...register("author")}
                className={cn("mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border", errors.author && "border-red-500")}
                placeholder="Broadcaster Name"
              />
              {errors.author && <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>}
            </div>

            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700">Area ID</label>
              <p className="text-xs text-gray-500 mb-1">エリアID: 録音対象のradikoのエリアIDを指定します。デプロイ時にradikoプレミアムの認証情報を指定しない場合はJP13のみ指定できます。</p>
              <input
                type="text"
                id="area"
                {...register("area")}
                className={cn("mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border", errors.area && "border-red-500")}
                placeholder="JP13"
              />
              {errors.area && <p className="mt-1 text-sm text-red-600">{errors.area.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">Image URL</label>
              <p className="text-xs text-gray-500 mb-1">画像: Podcastの番組サムネイルに使用する画像のURLを指定します</p>
              <input
                type="url"
                id="image"
                {...register("image")}
                className={cn("mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border", errors.image && "border-red-500")}
                placeholder="https://example.com/image.jpg"
              />
              {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Broadcast Schedule (Display)</label>
            <p className="text-xs text-gray-500 mb-2">番組開始日時: 録音対象番組の放送開始曜日と時間を日本時間で指定します</p>
            <div className="space-y-2">


              {programFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <Controller
                    control={control}
                    name={`program_schedule.${index}` as const}
                    render={({ field }) => (
                      <BroadcastSchedulePicker
                        value={field.value}
                        onChange={field.onChange}
                        className="flex-1"
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => removeProgram(index)}
                    className="p-2 text-gray-400 hover:text-red-500"
                    disabled={programFields.length === 1}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendProgram("")}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Schedule
              </button>
              {errors.program_schedule && (
                <p className="mt-1 text-sm text-red-600">{errors.program_schedule.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Execution Schedule (Recording)</label>
            <p className="text-xs text-gray-500 mb-2">録音開始日時: 録音処理を実行する曜日と日時を日本時間で指定します。録音処理はタイムフリーのAPIを使用して行うため、番組終了後の任意の時間を指定してください。</p>
            <div className="space-y-2">
              {executionFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Controller
                    control={control}
                    name={`execution_schedule.${index}` as const}
                    render={({ field }) => (
                      <ExecutionSchedulePicker
                        value={field.value}
                        onChange={field.onChange}
                        className="flex-1"
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => removeExecution(index)}
                    className="p-2 text-gray-400 hover:text-red-500"
                    disabled={executionFields.length === 1}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendExecution("")}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Execution Time
              </button>
              {errors.execution_schedule && (
                <p className="mt-1 text-sm text-red-600">{errors.execution_schedule.message}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Recording Schedule"}
            </button>
          </div>
        </form >
      </div >
    </div >
  );
}
