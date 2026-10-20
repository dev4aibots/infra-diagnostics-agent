"use client";

import * as React from "react";
import {
  Badge,
  Button,
  MessageBar,
  MessageBarBody,
  Switch,
  makeStyles,
  tokens,
} from "@fluentui/react-components";

const SAMPLE_ALERTS = [
  "OOMKilled payments-api pod restarted twice, memory working set at limit",
  "CrashLoopBackOff auth-svc after probe path change",
  "HighAPIErrorRate checkout-api 5xx spike in prod",
  "OOMKilled worker-queue memory usage climbing since deploy",
  "CrashLoopBackOff billing-svc readiness probe failing",
];

const useStyles = makeStyles({
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    margin: 0,
    marginBottom: tokens.spacingVerticalM,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalL,
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  // Live feed choreography (pattern after Magic UI animated-list, MIT):
  // new alerts slide in on mount, transform/opacity only, token easing.
  item: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    padding: tokens.spacingHorizontalM,
    animationName: "sentinel-stream-in",
    animationDuration: tokens.durationSlow,
    animationTimingFunction: tokens.curveDecelerateMid,
    animationFillMode: "both",
    "@media (max-width: 640px)": {
      flexWrap: "wrap",
    },
  },
  text: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    flexGrow: 1,
  },
  caption: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyBase,
    whiteSpace: "nowrap",
  },
});

function StreamKeyframes() {
  return (
    <style>{`@keyframes sentinel-stream-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } @media (prefers-reduced-motion: reduce) { .sentinel-stream-item { animation: none !important; } }`}</style>
  );
}

export type StreamItem = { id: number; at: string; text: string };

export function AlertStream({ onTriageText }: { onTriageText: (text: string) => void }) {
  const styles = useStyles();
  const [on, setOn] = React.useState(false);
  const [items, setItems] = React.useState<StreamItem[]>([]);
  const counter = React.useRef(0);
  const sampleIdx = React.useRef(0);

  React.useEffect(() => {
    if (!on) return;
    const id = setInterval(() => {
      counter.current += 1;
      const text = SAMPLE_ALERTS[sampleIdx.current % SAMPLE_ALERTS.length];
      sampleIdx.current += 1;
      const item: StreamItem = {
        id: counter.current,
        at: new Date().toLocaleTimeString(),
        text,
      };
      setItems((prev) => [item, ...prev].slice(0, 20));
    }, 6000);
    return () => clearInterval(id);
  }, [on ]);

  return (
    <div>
      <StreamKeyframes />
      <h2 className={styles.title}>Alert stream</h2>
      <div className={styles.section}>
        <MessageBar intent="info">
          <MessageBarBody>
            Sample alerts arrive every few seconds so you can watch the full flow. Every item
            is labeled <b>SIMULATED</b>. There is no real cluster behind this console.
          </MessageBarBody>
        </MessageBar>
        <div className={styles.toggleRow}>
          <Switch
            checked={on}
            onChange={(_, d) => setOn(d.checked)}
            label={on ? "Stream running (simulated)" : "Stream paused"}
          />
        </div>
      </div>
      <div className={styles.list}>
        {items.map((it) => (
          <div key={it.id} className={`${styles.item} sentinel-stream-item du-sev-rail`} data-du-sev="warning">
            <Badge appearance="tint" color="warning">
              SIMULATED
            </Badge>
            <span className={styles.text}>{it.text}</span>
            <span className={styles.caption}>{it.at}</span>
            <Button appearance="subtle" size="small" onClick={() => onTriageText(it.text)}>
              Diagnose this alert
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <span className={styles.caption}>
            {on ? "Waiting for the first sample alert\u2026" : "Turn the switch on to start the sample stream."}
          </span>
        )}
      </div>
    </div>
  );
}