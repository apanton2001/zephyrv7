import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * A component that provides theme context to its children
 * Manages dark/light mode using next-themes
 */
export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
