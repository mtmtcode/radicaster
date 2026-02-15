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
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen">
      <div className="flex flex-col items-center justify-center p-6 border-b border-gray-100">
        <img src="/logo.png" alt="Radicaster Logo" className="w-36 h-36 object-contain opacity-80" />
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      {/* Optional: Footer or user profile area could go here */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">Version 0.1.0</p>
      </div>
    </div>
  );
}
