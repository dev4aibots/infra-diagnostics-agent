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
  item: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    padding: tokens.spacingHorizontalM,
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
      <h2 className={styles.title}>Simulated alert stream</h2>
      <div className={styles.section}>
        <MessageBar intent="info">
          <MessageBarBody>
            A timer feeds sample alerts every few seconds so you can watch triage end to end.
            Every item is labeled <b>SIMULATED</b> — there is no live cluster behind this console.
          </MessageBarBody>
        </MessageBar>
        <div className={styles.toggleRow}>
          <Switch
            checked={on}
            onChange={(_, d) => setOn(d.checked)}
            label={on ? "Stream running (SIMULATED)" : "Stream paused"}
          />
        </div>
      </div>
      <div className={styles.list}>
        {items.map((it) => (
          <div key={it.id} className={styles.item}>
            <Badge appearance="tint" color="warning">
              SIMULATED
            </Badge>
            <span className={styles.text}>{it.text}</span>
            <span className={styles.caption}>{it.at}</span>
            <Button appearance="subtle" size="small" onClick={() => onTriageText(it.text)}>
              Triage this alert
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <span className={styles.caption}>
            {on ? "Waiting for the first sample alert…" : "Flip the switch to start the simulated stream."}
          </span>
        )}
      </div>
    </div>
  );
}
