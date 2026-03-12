'use client';

import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function AppProviders({ children }: { children: ReactNode }) {
  
  return (
    <QueryClientProvider client={queryClient}>
        {children}
      <ToastContainer aria-label="Notifications" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
