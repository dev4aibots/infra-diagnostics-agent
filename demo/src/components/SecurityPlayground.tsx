"use client";

import * as React from "react";
import { ThemeContext } from "../app/providers";
import {
  Badge,
  Button,
  Card,
  MessageBar,
  MessageBarBody,
  Spinner,
  makeStyles,
  tokens

} from "@fluentui/react-components";
import { runProbe, type ProbeMode, type ProbeResult } from "@/lib/client";

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
  row: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
    alignItems: "center",
  },
  card: { backgroundColor: tokens.colorNeutralBackground1 },
  cardHead: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  headTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
  },
  kv: {
    display: "grid",
    gridTemplateColumns: "max-content 1fr",
    gap: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    alignItems: "start",
  },
  key: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
    whiteSpace: "nowrap",
  },
  value: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    overflowWrap: "anywhere",
  },
  pre: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    overflowX: "auto",
    margin: 0,
  },
});

const SCENARIOS: { mode: ProbeMode; label: string; hint: string }[] = [
  { mode: "valid", label: "Valid signature", hint: "Fresh timestamp, correct HMAC → 200" },
  { mode: "tampered", label: "Tampered signature", hint: "Digest altered → 401 mismatch" },
  { mode: "stale", label: "Stale timestamp", hint: "Older than 300s → 401 stale" },
];

export function SecurityPlayground() {
  const styles = useStyles();
  const { theme } = React.useContext(ThemeContext);
  const [loading, setLoading] = React.useState<ProbeMode | null>(null);
  const [result, setResult] = React.useState<ProbeResult | null>(null);

  const fire = async (mode: ProbeMode) => {
    setLoading(mode);
    try {
      const { result } = await runProbe(mode);
      setResult(result);
    } finally {
      setLoading(null);
    }
  };

  const ok = result !== null && result.status === 200;

  return (
    <div>
      <h2 className={styles.title}>Signature playground</h2>
      <div className={styles.section}>
        <MessageBar intent="info">
          <MessageBarBody>
            Every request is verified with Slack&apos;s signing scheme: <b>HMAC-SHA256</b> over
            <b> v0:timestamp:body</b>, compared in constant time, with a <b>300&nbsp;s</b> replay
            window. These probes drive the real verification code — nothing is stubbed.
          </MessageBarBody>
        </MessageBar>
        <div className={styles.row}>
          {SCENARIOS.map((s) => (
            <Button
              key={s.mode}
              appearance={s.mode === "valid" ? "primary" : "secondary"}
              disabled={loading !== null}
              onClick={() => void fire(s.mode)}
              title={s.hint}
            >
              {loading === s.mode ? <Spinner size="tiny" /> : s.label}
            </Button>
          ))}
        </div>
      </div>

      {result && (
        <Card className={styles.card}>
          <div className={styles.cardHead}>
            <Badge appearance="filled" color={ok ? "success" : "danger"} size="large">
              HTTP {result.status}
            </Badge>
            <span className={styles.headTitle}>
              {result.mode === "valid" && "Valid request — accepted"}
              {result.mode === "tampered" && "Tampered request — rejected"}
              {result.mode === "stale" && "Stale request — rejected"}
            </span>
          </div>
          <div className={styles.section}>
            <div>
              <div className={styles.key} style={{ marginBottom: tokens.spacingVerticalS }}>
                Handler response body
              </div>
              <pre className={styles.pre} style={{ fontFamily: theme.fontFamilyMonospace }}>
                {JSON.stringify(result.body, null, 2)}
              </pre>
            </div>
            <div className={styles.kv} style={{ fontFamily: theme.fontFamilyMonospace }}>
              <span className={styles.key}>timestamp</span>
              <span className={styles.value}>{result.request.timestamp}</span>
              <span className={styles.key}>base string</span>
              <span className={styles.value}>{result.request.baseString}</span>
              <span className={styles.key}>signature</span>
              <span className={styles.value}>{result.request.signature}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
