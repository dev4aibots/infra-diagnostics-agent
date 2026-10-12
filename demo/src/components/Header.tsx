"use client";

import * as React from "react";
import {
  Avatar,
  Badge,
  Button,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens

} from "@fluentui/react-components";
import { ShieldCheckmarkRegular, WeatherMoonRegular, WeatherSunnyRegular } from "@fluentui/react-icons";
import { ThemeContext } from "../app/providers";

const useStyles = makeStyles({
  bar: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottomWidth: tokens.strokeWidthThin,
    borderBottomStyle: "solid",
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  icon: {
    color: tokens.colorBrandForeground1,
    fontSize: tokens.fontSizeHero700,
    display: "flex",
  },
  wordmarkWrap: {
    display: "flex",
    flexDirection: "column",
    lineHeight: tokens.lineHeightBase300,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyBase,
  },
  spacer: { marginLeft: "auto", display: "flex", alignItems: "center", gap: tokens.spacingHorizontalM },
  // The single restrained wow element (DESIGN.md §7): a slow shimmer sweep
  // across the product wordmark. Implemented independently (no upstream code
  // copied); effect inspired by react-bits ShinyText — DavidHDev/react-bits,
  // MIT + Commons Clause v1.0, verified 2026-10-12 (use-as-part-of-app is
  // permitted). All colors are theme tokens; the sweep is the §7 exception.
  wordmark: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: tokens.fontFamilyBase,
    backgroundSize: "200% 100%",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
    animationName: "sentinel-shine",
    animationDuration: "4s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
});

function ShinyWordmark({ text }: { text: string }) {
  const styles = useStyles();
  const { theme } = React.useContext(ThemeContext);
  const gradient =
    `linear-gradient(110deg, ${theme.colorNeutralForeground1} 35%, ` +
    `${theme.colorBrandForeground1} 50%, ${theme.colorNeutralForeground1} 65%)`;
  return (
    <>
      <style>{`@keyframes sentinel-shine { 0% { background-position: 200% center; } 100% { background-position: -200% center; } } @media (prefers-reduced-motion: reduce) { .sentinel-shiny { animation: none !important; } }`}</style>
      <span className={mergeClasses(styles.wordmark, "sentinel-shiny")} style={{ backgroundImage: gradient }}>
        {text}
      </span>
    </>
  );
}

export function Header() {
  const styles = useStyles();
  const { dark, toggle } = React.useContext(ThemeContext);
  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <span className={styles.icon} aria-hidden="true">
          <ShieldCheckmarkRegular />
        </span>
        <div className={styles.wordmarkWrap}>
          <ShinyWordmark text="Sentinel" />
          <span className={styles.subtitle}>Simulated on-call console</span>
        </div>
      </div>
      <div className={styles.spacer}>
        <Badge appearance="tint" color="warning" size="medium">
          SIMULATED
        </Badge>
        <Tooltip content={dark ? "Switch to light theme" : "Switch to dark theme"} relationship="label">
          <Button
            appearance="subtle"
            icon={dark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={toggle}
          />
        </Tooltip>
        <Tooltip content="On-call engineer (simulated identity)" relationship="label">
          <Avatar name="On-call" size={32} color="brand" />
        </Tooltip>
      </div>
    </header>
  );
}