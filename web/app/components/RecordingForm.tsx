"use client";

import { useFieldArray, useForm, Controller, useWatch, Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Clock, MapPin, Radio, User, FileText, Image as ImageIcon, Save, Fingerprint } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { BroadcastSchedulePicker } from "@/app/components/BroadcastSchedulePicker";
import { RADIKO_AREAS, RADIKO_STATIONS, DEFAULT_AREA_ID } from "@/app/constants/radiko";
import { cn } from "@/lib/utils";

// Internal schema for the form
const scheduleItemSchema = z.object({
  startDay: z.string(),
  startHour: z.string(),
  startMinute: z.string(),
  durationMinutes: z.number({ invalid_type_error: "時間を入力してください" }).min(1, "1分以上で指定してください"),
  offsetMinutes: z.number().min(0).default(5),
});

const formSchema = z.object({
  id: z.string().min(1, "IDは必須です").regex(/^[a-z0-9_-]+$/, "半角英数字、ハイフン、アンダースコアのみ使用可能です"),
  title: z.string().min(1, "タイトルは必須です"),
  author: z.string().min(1, "作者名は必須です"),
  imageFile: z.any().optional(),
  area: z.string().min(1, "エリアを選択してください"),
  station: z.string().min(1, "放送局を選択してください"),
  schedules: z.array(scheduleItemSchema).min(1, "スケジュールを1つ以上登録してください"),
  retentionType: z.enum(["none", "count", "days"]).default("none"),
  retentionValue: z.number().min(1, "1以上を指定してください").optional(),
}).refine(
  (data) => data.retentionType === "none" || (data.retentionValue !== undefined && data.retentionValue >= 1),
  { message: "保持数を入力してください", path: ["retentionValue"] }
);

export type FormValues = z.infer<typeof formSchema>;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_JA = { "Mon": "月", "Tue": "火", "Wed": "水", "Thu": "木", "Fri": "金", "Sat": "土", "Sun": "日" };

// Helper to calculate execution time
function calculateExecutionTime(day: string, hour: string, minute: string, duration: number, offset: number) {
  const dayIndex = DAYS.indexOf(day);
  if (dayIndex === -1) return "---";

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

  return `${DAYS_JA[newDay as keyof typeof DAYS_JA] || newDay} ${newHour}:${newMinute}`;
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
    retentionType: "none",
    retentionValue: undefined,
    ...initialValues,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues,
  });

  const { register, control, handleSubmit, formState: { errors }, reset } = form;

  useEffect(() => {
    if (initialValues) {
      reset({ ...defaultValues, ...initialValues });
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      {/* Basic Info Section */}
      <section className="space-y-6">
        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
            <FileText className="w-5 h-5" />
          </span>
          基本情報
        </h3>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="group">
            <label htmlFor="id" className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-2">
              <Fingerprint className="h-4 w-4 text-gray-400" />
              ID
            </label>
            <input
              type="text"
              id="id"
              {...register("id")}
              disabled={isEditing}
              className={cn(
                "block w-full rounded-2xl border-2 border-gray-200 bg-gray-50/50 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 sm:text-sm p-4 transition-all outline-none",
                errors.id && "border-red-300 focus:border-red-500 focus:ring-red-200",
                isEditing && "bg-gray-100 text-gray-500 cursor-not-allowed border-transparent"
              )}
              placeholder="program-id-example"
            />
            {errors.id && <p className="mt-1 text-xs font-bold text-red-500">{errors.id.message}</p>}
          </div>

          <div className="group">
            <label htmlFor="title" className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-2">
              <TypeIcon className="h-4 w-4 text-gray-400" />
              番組タイトル
            </label>
            <input
              type="text"
              id="title"
              {...register("title")}
              className={cn(
                "block w-full rounded-2xl border-2 border-gray-200 bg-gray-50/50 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 sm:text-sm p-4 transition-all outline-none",
                errors.title && "border-red-300 focus:border-red-500 focus:ring-red-200"
              )}
              placeholder="素敵なラジオ番組"
            />
            {errors.title && <p className="mt-1 text-xs font-bold text-red-500">{errors.title.message}</p>}
          </div>

          <div className="group">
            <label htmlFor="author" className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-2">
              <User className="h-4 w-4 text-gray-400" />
              配信者 (Author)
            </label>
            <input
              type="text"
              id="author"
              {...register("author")}
              className={cn(
                "block w-full rounded-2xl border-2 border-gray-200 bg-gray-50/50 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 sm:text-sm p-4 transition-all outline-none",
                errors.author && "border-red-300 focus:border-red-500 focus:ring-red-200"
              )}
              placeholder="放送局名など"
            />
            {errors.author && <p className="mt-1 text-xs font-bold text-red-500">{errors.author.message}</p>}
          </div>

          <div className="group">
            <label htmlFor="imageFile" className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-2">
              <ImageIcon className="h-4 w-4 text-gray-400" />
              アートワーク
            </label>
            <input
              type="file"
              id="imageFile"
              accept="image/jpeg,image/png"
              {...register("imageFile")}
              className={cn(
                "block w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 p-2 cursor-pointer transition-colors hover:border-gray-300",
                errors.imageFile && "border-red-300"
              )}
            />
            {errors.imageFile && <p className="mt-1 text-xs font-bold text-red-500">{String(errors.imageFile.message)}</p>}
          </div>
        </div>
      </section>

      {/* Station Section */}
      <section className="space-y-6">
        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
            <Radio className="w-5 h-5" />
          </span>
          放送局設定
        </h3>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="group">
            <label htmlFor="area" className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              エリア
            </label>
            <div className="relative">
              <select
                id="area"
                {...register("area")}
                className={cn("block w-full rounded-2xl border-2 border-gray-200 bg-gray-50/50 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 sm:text-sm p-4 transition-all outline-none appearance-none", errors.area && "border-red-300")}
              >
                {RADIKO_AREAS.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>

          <div className="group">
            <label htmlFor="station" className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-2">
              <Radio className="h-4 w-4 text-gray-400" />
              放送局
            </label>
            <div className="relative">
              <select
                id="station"
                {...register("station")}
                className={cn("block w-full rounded-2xl border-2 border-gray-200 bg-gray-50/50 shadow-sm focus:border-gray-400 focus:ring focus:ring-gray-200 sm:text-sm p-4 transition-all outline-none appearance-none", errors.station && "border-red-300")}
              >
                <option value="">放送局を選択してください</option>
                {filteredStations.map((station) => (
                  <option key={station.id} value={station.id}>{station.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
            {errors.station && <p className="mt-1 text-xs font-bold text-red-500">{errors.station.message}</p>}
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="space-y-6">
        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
            <Clock className="w-5 h-5" />
          </span>
          録音スケジュール
        </h3>

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
            className="mt-2 inline-flex items-center px-5 py-3 border-2 border-dashed border-gray-300 text-sm font-bold rounded-2xl text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none"
          >
            <Plus className="h-5 w-5 mr-2" /> スケジュールを追加
          </button>
        </div>
        {errors.schedules && (
          <p className="mt-1 text-sm font-bold text-red-500">{errors.schedules.message}</p>
        )}
      </section>

      <RetentionSettings control={control} register={register} errors={errors} />

      <div className="pt-8">
        <button
          type="submit"
          disabled={isSubmitting}
          className="pop-button w-full flex justify-center py-4 px-6 border border-transparent rounded-2xl shadow-lg shadow-primary/30 text-base font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> 保存中...</span>
          ) : (
            <span className="flex items-center"><Save className="w-5 h-5 mr-2" /> 設定を保存する</span>
          )}
        </button>
      </div>
    </form>
  );
}

// Icon component needed for fields
function TypeIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" x2="15" y1="20" y2="20" /><line x1="12" x2="12" y1="4" y2="20" /></svg>
}


interface ScheduleRowProps {
  index: number;
  control: Control<FormValues>;
  register: UseFormRegister<FormValues>;
  remove: () => void;
  canRemove: boolean;
  errors: FieldErrors<FormValues>;
}

interface RetentionSettingsProps {
  control: Control<FormValues>;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
}

function RetentionSettings({ control, register, errors }: RetentionSettingsProps) {
  const retentionType = useWatch({ control, name: "retentionType" });

  return (
    <div className="p-6 border-2 border-gray-100 rounded-2xl bg-white space-y-4">
      <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
        <Trash2 className="w-4 h-4 text-gray-600" />
        自動削除 (保持ポリシー)
      </h4>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-full sm:w-1/3">
          <div className="relative">
            <select
              {...register("retentionType")}
              className="block w-full rounded-2xl border-gray-200 bg-gray-50/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-4 outline-none appearance-none"
            >
              <option value="none">自動削除しない (全て保存)</option>
              <option value="count">最新 N 件のみ保持</option>
              <option value="days">最新 N 日分のみ保持</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
            </div>
          </div>
        </div>

        {retentionType !== "none" && (
          <div className="w-full sm:w-1/4 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="relative">
              <input
                type="number"
                min={1}
                {...register("retentionValue", { valueAsNumber: true })}
                className={cn(
                  "block w-full rounded-2xl border-gray-200 bg-gray-50/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-4 outline-none",
                  errors.retentionValue && "border-red-300 bg-red-50"
                )}
                placeholder="10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold pointer-events-none">
                {retentionType === 'count' ? '件' : '日'}
              </span>
            </div>
            {errors.retentionValue && (
              <p className="mt-1 text-xs font-bold text-red-500">{errors.retentionValue.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduleRow({ index, control, register, remove, canRemove, errors }: ScheduleRowProps) {
  const watchStartDay = useWatch({ control, name: `schedules.${index}.startDay` });
  const watchStartHour = useWatch({ control, name: `schedules.${index}.startHour` });
  const watchStartMinute = useWatch({ control, name: `schedules.${index}.startMinute` });
  const watchDuration = useWatch({ control, name: `schedules.${index}.durationMinutes` });
  const watchOffset = useWatch({ control, name: `schedules.${index}.offsetMinutes` });

  const executionTime = calculateExecutionTime(watchStartDay, watchStartHour, watchStartMinute, watchDuration, watchOffset || 0);

  return (
    <div className="pop-card bg-white p-6 border-2 border-gray-100 relative group rounded-2xl">
      <button
        type="button"
        onClick={remove}
        className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0"
        disabled={!canRemove}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-end">
        {/* Broadcast Time */}
        <div className="sm:col-span-5 space-y-1">
          <label className="text-xs font-bold text-gray-500">放送開始日時</label>
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

        {/* Duration */}
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-bold text-gray-500">長さ (分)</label>
          <input
            type="number"
            {...register(`schedules.${index}.durationMinutes`, { valueAsNumber: true })}
            className="block w-full rounded-2xl border-gray-200 bg-gray-50 shadow-sm focus:border-primary focus:ring-primary/20 sm:text-sm p-3 outline-none text-center font-bold"
            placeholder="120"
          />
        </div>

        {/* Offset */}
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-bold text-gray-500">録音遅延 (分)</label>
          <input
            type="number"
            {...register(`schedules.${index}.offsetMinutes`, { valueAsNumber: true })}
            className="block w-full rounded-2xl border-gray-200 bg-gray-50 shadow-sm focus:border-primary focus:ring-primary/20 sm:text-sm p-3 outline-none text-center text-gray-500"
            placeholder="10"
          />
        </div>

        {/* Execution Time Preview */}
        <div className="sm:col-span-3 pb-2 text-right sm:text-center">
          <span className="block text-[10px] font-bold text-gray-400 mb-0.5">実際の録音開始</span>
          <span className="text-sm font-black text-primary bg-primary/5 px-2 py-1 rounded-md">{executionTime}</span>
        </div>
      </div>

      {errors.schedules?.[index]?.durationMinutes && (
        <p className="mt-2 text-xs font-bold text-red-500 text-center">{errors.schedules[index]?.durationMinutes?.message}</p>
      )}
    </div>
  );
}
