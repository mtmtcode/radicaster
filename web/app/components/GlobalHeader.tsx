"use client";

import Link from "next/link";

export function GlobalHeader() {
  return (
    <header className="w-full bg-card border-b border-dashed border-gray-200">
      <div className="flex flex-row items-center justify-center py-6 gap-6">
        <Link href="/" className="group relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all duration-500" />
          <img
            src="/logo.png"
            alt="Radicaster Logo"
            className="w-16 h-16 md:w-20 md:h-20 object-contain relative z-10 transform group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
          />
        </Link>
        <div className="text-left">
          <h1 className="font-bold text-2xl md:text-3xl text-primary tracking-tight mb-1">Radicaster</h1>
          <p className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-widest">Recording Scheduler</p>
        </div>
      </div>
    </header>
  );
}
