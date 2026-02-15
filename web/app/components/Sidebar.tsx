"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Radio, ListMusic, PlusCircle, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "ライブラリ", href: "/", icon: LayoutGrid },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-20 md:w-64 bg-card h-screen border-r border-dashed border-gray-200 sticky top-0 z-50 transition-all duration-300">
      <div className="flex flex-col items-center justify-center py-8">
        <Link href="/" className="group relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all duration-500" />
          <img
            src="/logo.png"
            alt="Radicaster Logo"
            className="w-12 h-12 md:w-32 md:h-32 object-contain relative z-10 transform group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
          />
        </Link>
        <div className="hidden md:block mt-4 text-center">
          <h1 className="font-bold text-lg text-primary tracking-tight">Radicaster</h1>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Recording Scheduler</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-3 text-sm font-semibold rounded-xl transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-6 w-6 md:mr-3 transition-transform duration-200",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-primary group-hover:scale-110"
                )}
              />
              <span className="hidden md:block">{item.name}</span>

              {isActive && (
                <div className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="hidden md:block p-6">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100/50">
          <p className="text-xs text-indigo-400 font-semibold mb-1">SYSTEM STATUS</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs text-indigo-900 font-medium">Online v0.1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
