import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

interface AppLayoutProps {
  children: React.ReactNode;
  role: "admin" | "user";
  userName?: string;
  onLogout: () => void;
}

export function AppLayout({ children, role, userName, onLogout }: AppLayoutProps) {
  const router = useRouter();

  return (
    <div className={`flex min-h-screen bg-[#F3F4FF] ${inter.className}`}>
      
      {/* SIDEBAR (KIRI) */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#263C92]">Sistem BKD</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {role === "admin" ? (
            <>
              {/* Menu Admin */}
              <Link 
                href="/admin/users" 
                className={`block px-4 py-2 rounded-md font-medium transition-colors ${
                  router.pathname.includes("/admin/users") 
                    ? "bg-[#837AE8] text-white" 
                    : "text-gray-600 hover:bg-[#EAE8FF] hover:text-[#263C92]"
                }`}
              >
                Manage Users
              </Link>
              <Link 
                href="/admin/semesters" 
                className={`block px-4 py-2 rounded-md font-medium transition-colors ${
                  router.pathname.includes("/admin/semesters") 
                    ? "bg-[#837AE8] text-white" 
                    : "text-gray-600 hover:bg-[#EAE8FF] hover:text-[#263C92]"
                }`}
              >
                Manage Semesters
              </Link>
            </>
          ) : (
            <>
              {/* Menu User */}
              <Link 
                href="/" 
                className={`block px-4 py-2 rounded-md font-medium transition-colors ${
                  router.pathname === "/" 
                    ? "bg-[#837AE8] text-white" 
                    : "text-gray-600 hover:bg-[#EAE8FF] hover:text-[#263C92]"
                }`}
              >
                Dashboard
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* AREA KONTEN */}
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        
        {/* NAVBAR */}
        <header className="flex justify-between items-center p-8 pb-4 border-b border-gray-300">
          <h1 className="text-4xl font-bold text-[#263C92]">
            {role === "admin" ? "Admin Dashboard" : "Dashboard"}
          </h1>
          <div className="flex items-center gap-4 text-gray-700">
            <span className="text-lg font-medium">
              Hi, {userName || (role === "admin" ? "Admin" : "User")}!
            </span>
            <Button 
              onClick={onLogout} 
              variant="outline" 
              className="rounded-lg transition-colors bg-[#DD3333] text-white hover:bg-red-200 hover:text-red-800 border border-red-100"
            >
              Logout
            </Button>
          </div>
        </header>

        {/* ISI HALAMAN */}
        <main className="p-8 overflow-y-auto">
          {children}
        </main>
      </div>
      
    </div>
  );
}