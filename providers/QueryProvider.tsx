"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState, useEffect } from "react";

import { createQueryClient } from "@/lib/query-error-handling";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient());

  useEffect(() => {
    // Initialize development debugging tools
    if (process.env.NODE_ENV === "development") {
      (window as any).queryDebug?.init(queryClient);
    }
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* TanStack Query devtools disabled */}
    </QueryClientProvider>
  );
}
