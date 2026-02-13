"use client";

import { useFieldArray, useForm, Controller, useWatch, Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { BroadcastSchedulePicker } from "@/app/components/BroadcastSchedulePicker";
import { RADIKO_AREAS, RADIKO_STATIONS, DEFAULT_AREA_ID } from "@/app/constants/radiko";
import { cn } from "@/lib/utils";

// Internal schema for the form
const scheduleItemSchema = z.object({
  startDay: z.string(),
  startHour: z.string(),
  startMinute: z.string(),
  durationMinutes: z.number().min(1, "Duration must be at least 1 minute"),
  offsetMinutes: z.number().min(0, "Offset must be at least 0 minutes").default(5),
});

const formSchema = z.object({
  id: z.string().min(1, "ID is required").regex(/^[a-z0-9_-]+$/, "ID must be lowercase alphanumeric, dash, or underscore"),
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  // imageFile is optional in schema, created as needed
  imageFile: z.any().optional(),
  area: z.string().min(1, "Area ID is required"),
  station: z.string().min(1, "Station ID is required"),
  schedules: z.array(scheduleItemSchema).min(1, "At least one schedule is required"),
});

export type FormValues = z.infer<typeof formSchema>;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Helper to calculate execution time
function calculateExecutionTime(day: string, hour: string, minute: string, duration: number, offset: number) {
  const dayIndex = DAYS.indexOf(day);
  if (dayIndex === -1) return "Invalid Day";

  const totalCurrentMinutes = parseInt(hour || "0") * 60 + parseInt(minute || "0");
  const totalMinutesVal = totalCurrentMinutes + (duration || 0) + (offset || 0);
  let totalMinutes = totalMinutesVal;
  let newDayIndex = dayIndex;

  // Handle day rollover
  while (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    newDayIndex = (newDayIndex + 1) % 7;
  }

  const newHour = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const newMinute = (totalMinutes % 60).toString().padStart(2, "0");
  const newDay = DAYS[newDayIndex];

  return `${newDay} ${newHour}:${newMinute}`;
}

interface RecordingFormProps {
  initialValues?: Partial<FormValues>;
  isEditing?: boolean;
  onSubmit: (data: FormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function RecordingForm({ initialValues, isEditing = false, onSubmit, isSubmitting = false }: RecordingFormProps) {
  const defaultValues: FormValues = {
    id: "",
    title: "",
    author: "",
    imageFile: null,
    area: DEFAULT_AREA_ID,
    station: "",
    schedules: [{ startDay: "Mon", startHour: "21", startMinute: "00", durationMinutes: undefined as any, offsetMinutes: 5 }],
    ...initialValues,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues,
  });

  const { register, control, handleSubmit, formState: { errors }, reset } = form;

  // Reset form when initialValues change
  useEffect(() => {
    if (initialValues) {
      reset({
        ...defaultValues,
        ...initialValues
      });
    }
  }, [initialValues, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedules",
  });

  const selectedArea = useWatch({ control, name: "area" });

  const filteredStations = useMemo(() => {
    return RADIKO_STATIONS.filter((s) => s.areaId === selectedArea);
  }, [selectedArea]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="id" className="block text-sm font-medium text-gray-700">ID</label>
          <p className="text-xs text-gray-500 mb-1">番組ID: 番組を一意に識別する文字列</p>
          <input
            type="text"
            id="id"
            {...register("id")}
            disabled={isEditing}
            className={cn(
              "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border",
              errors.id && "border-red-500",
              isEditing && "bg-gray-100 text-gray-500 cursor-not-allowed"
            )}
            placeholder="my-radio-program"
          />
          {errors.id && <p className="mt-1 text-sm text-red-600">{errors.id.message}</p>}
        </div>

        <div>
          <label htmlFor="area" className="block text-sm font-medium text-gray-700">Area</label>
          <p className="text-xs text-gray-500 mb-1">エリア: 録音対象のradikoのエリア</p>
          <select
            id="area"
            {...register("area")}
            className={cn("mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border", errors.area && "border-red-500")}
          >
            {RADIKO_AREAS.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name} ({area.id})
              </option>
            ))}
          </select>
          {errors.area && <p className="mt-1 text-sm text-red-600">{errors.area.message}</p>}
        </div>

        <div>
          <label htmlFor="station" className="block text-sm font-medium text-gray-700">Station</label>
          <p className="text-xs text-gray-500 mb-1">放送局: 録音対象の放送局</p>
          <select
            id="station"
            {...register("station")}
            className={cn("mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border", errors.station && "border-red-500")}
          >
            <option value="">Select a station</option>
            {filteredStations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name} ({station.id})
              </option>
            ))}
          </select>
          {errors.station && <p className="mt-1 text-sm text-red-600">{errors.station.message}</p>}
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <p className="text-xs text-gray-500 mb-1">番組名: 生成されるPodcastフィードの番組名</p>
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
          <p className="text-xs text-gray-500 mb-1">作者: 生成されるPodcastの作者フィールド</p>
          <input
            type="text"
            id="author"
            {...register("author")}
            className={cn("mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border", errors.author && "border-red-500")}
            placeholder="Broadcaster Name"
          />
          {errors.author && <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700">Artwork Image</label>
          <p className="text-xs text-gray-500 mb-1">画像: Podcastのアートワーク (JPEG/PNG)</p>
          <input
            type="file"
            id="imageFile"
            accept="image/jpeg,image/png"
            {...register("imageFile")}
            className={cn("mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100", errors.imageFile && "border-red-500")}
          />
          {errors.imageFile && <p className="mt-1 text-sm text-red-600">{String(errors.imageFile.message)}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Schedules, Duration and Recording Offset</label>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <ScheduleRow
              key={field.id}
              index={index}
              control={control}
              register={register}
              remove={() => remove(index)}
              canRemove={fields.length > 1}
              errors={errors}
            />
          ))}

          <button
            type="button"
            onClick={() => append({ startDay: "Mon", startHour: "21", startMinute: "00", durationMinutes: undefined as any, offsetMinutes: 5 })}
            className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Schedule
          </button>
        </div>
        {errors.schedules && (
          <p className="mt-1 text-sm text-red-600">{errors.schedules.message}</p>
        )}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : isEditing ? "Update Recording Schedule" : "Save Recording Schedule"}
        </button>
      </div>
    </form>
  );
}

interface ScheduleRowProps {
  index: number;
  control: Control<FormValues>;
  register: UseFormRegister<FormValues>;
  remove: () => void;
  canRemove: boolean;
  errors: FieldErrors<FormValues>;
}

function ScheduleRow({ index, control, register, remove, canRemove, errors }: ScheduleRowProps) {
  const watchStartDay = useWatch({ control, name: `schedules.${index}.startDay` });
  const watchStartHour = useWatch({ control, name: `schedules.${index}.startHour` });
  const watchStartMinute = useWatch({ control, name: `schedules.${index}.startMinute` });
  const watchDuration = useWatch({ control, name: `schedules.${index}.durationMinutes` });
  const watchOffset = useWatch({ control, name: `schedules.${index}.offsetMinutes` });

  const executionTime = calculateExecutionTime(watchStartDay, watchStartHour, watchStartMinute, watchDuration, watchOffset || 0);

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-md bg-gray-50 items-start sm:items-center">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-1">Broadcast Start Time</label>
        <p className="text-[10px] text-gray-400 mb-1">番組の放送開始日時</p>
        <Controller
          control={control}
          name={`schedules.${index}`}
          render={({ field: { value, onChange } }) => (
            <BroadcastSchedulePicker
              value={`${value.startDay} ${value.startHour}:${value.startMinute}`}
              onChange={(newVal) => {
                const [day, time] = newVal.split(" ");
                const [hour, minute] = time.split(":");
                onChange({ ...value, startDay: day, startHour: hour, startMinute: minute });
              }}
            />
          )}
        />
      </div>

      <div className="w-full sm:w-28">
        <label className="block text-xs font-medium text-gray-500 mb-1">Duration (min)</label>
        <p className="text-[10px] text-gray-400 mb-1">番組の長さ（分）</p>
        <input
          type="number"
          {...register(`schedules.${index}.durationMinutes`, { valueAsNumber: true })}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />
        {errors.schedules?.[index]?.durationMinutes && (
          <p className="mt-1 text-xs text-red-600">{errors.schedules[index]?.durationMinutes?.message}</p>
        )}
      </div>

      <div className="w-full sm:w-28">
        <label className="block text-xs font-medium text-gray-500 mb-1">Offset (min)</label>
        <p className="text-[10px] text-gray-400 mb-1">終了から録音までの分数</p>
        <input
          type="number"
          {...register(`schedules.${index}.offsetMinutes`, { valueAsNumber: true })}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />
        {errors.schedules?.[index]?.offsetMinutes && (
          <p className="mt-1 text-xs text-red-600">{errors.schedules[index]?.offsetMinutes?.message}</p>
        )}
      </div>

      <div className="flex-1 sm:text-right">
        <label className="block text-xs font-medium text-gray-500 mb-1">Execution Time</label>
        <p className="text-[10px] text-gray-400 mb-1">実際の録音開始日時</p>
        <div className="text-sm font-semibold text-gray-900">{executionTime}</div>
      </div>

      <button
        type="button"
        onClick={remove}
        className="p-2 text-gray-400 hover:text-red-500 mt-2 sm:mt-0"
        disabled={!canRemove}
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
}
