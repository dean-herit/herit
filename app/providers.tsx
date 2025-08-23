"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { QueryProvider } from "@/providers/QueryProvider";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <div data-component-category="layout" data-component-id="providers">
      <QueryProvider>
        <HeroUIProvider
          data-component-category="ui"
          data-component-id="hero-u-i-provider"
          navigate={router.push}
        >
          <NextThemesProvider
            {...themeProps}
            data-component-category="ui"
            data-component-id="next-themes-provider"
          >
            {children}
          </NextThemesProvider>
        </HeroUIProvider>
      </QueryProvider>
    </div>
  );
}
