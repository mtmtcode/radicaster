"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mic, Radio, ListMusic } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "New Recording", href: "/recordings/new", icon: Mic },
  { name: "Recordings", href: "/", icon: ListMusic },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white h-screen">
      <div className="flex items-center justify-center h-16 border-b border-gray-800">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Radio className="h-6 w-6" />
          Radicaster
        </h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
