'use client';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardBreadcrumb } from "@/components/dashboardBreadcrumb";

import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function Layout({ children }: { children: React.ReactNode }) {
const { user, loading } = useAuth();
const router = useRouter();

useEffect(() => {
  if (!loading && !user) {
    router.push("/login");
  }
}, [user, loading, router]);

if (loading) return null; // wait until auth check finishes
if (!user) return null;   // prevent flash

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar />

          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-20 flex border-b border-gray-200 shadow-sm p-4">
              <div className="flex items-center">
                <SidebarTrigger />
                <div className="mx-3 h-4 w-px bg-gray-400" />
                <DashboardBreadcrumb />
              </div>
            </header>
            <main className="flex-1 overflow-y-auto px-6 py-2 bg-gray-100">
                {children}
            </main>

            <footer className="border-t border-gray-200 bg-white text-sm px-4 py-2 text-center text-gray-500">
              &copy; {new Date().getFullYear()} FastWEB. All rights reserved.
            </footer>
          </div>
        </div>
      </SidebarProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
