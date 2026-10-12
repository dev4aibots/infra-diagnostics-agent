"use client";

import * as React from "react";
import {
  FluentProvider,
  RendererProvider,
  SSRProvider,
  Toaster,
  createDOMRenderer,
  renderToStyleElements,
  webDarkTheme,
  webLightTheme,
  type Theme,
} from "@fluentui/react-components";
import { useServerInsertedHTML } from "next/navigation";

export const ThemeContext = React.createContext<{
  dark: boolean;
  toggle: () => void;
  theme: Theme;
}>({ dark: false, toggle: () => {}, theme: webLightTheme });

// FluentProvider is client-only; Griffel styles are extracted on the server
// via useServerInsertedHTML per the react.fluentui.dev App Router recipe.
// <body> background is set manually — FluentProvider does not theme it.
export function Providers({ children }: { children: React.ReactNode }) {
  const [renderer] = React.useState(() => createDOMRenderer());
  const [dark, setDark] = React.useState(false);

  useServerInsertedHTML(() => <>{renderToStyleElements(renderer)}</>);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const theme: Theme = dark ? webDarkTheme : webLightTheme;

  React.useEffect(() => {
    // All values below come from the theme object itself — no raw values.
    document.body.style.margin = "0";
    document.body.style.backgroundColor = theme.colorNeutralBackground2;
    document.body.style.color = theme.colorNeutralForeground1;
    document.body.style.fontFamily = theme.fontFamilyBase;
  }, [theme]);

  const value = React.useMemo(
    () => ({ dark, toggle: () => setDark((d) => !d), theme }),
    [dark, theme],
  );

  return (
    <RendererProvider renderer={renderer}>
      <SSRProvider>
        <FluentProvider theme={theme}>
          <ThemeContext.Provider value={value}>
            <Toaster />
            {children}
          </ThemeContext.Provider>
        </FluentProvider>
      </SSRProvider>
    </RendererProvider>
  );
}
