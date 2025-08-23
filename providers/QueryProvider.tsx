"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState, useEffect } from "react";

import { createQueryClient } from "@/lib/query-error-handling";
import { enhanceQueryDevtools } from "@/lib/dev-utils";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => createQueryClient());

  useEffect(() => {
    // Initialize development debugging tools
    if (process.env.NODE_ENV === "development") {
      enhanceQueryDevtools();
      (window as any).queryDebug?.init(queryClient);
    }
  }, [queryClient]);

  return (
    <QueryClientProvider
      client={queryClient}
      data-component-category="ui"
      data-component-id="query-client-provider"
    >
      {children}
      {/* TanStack Query devtools disabled */}
    </QueryClientProvider>
  );
}
