"use client";

import * as React from "react";
import { ThemeContext } from "../app/providers";
import {
  Button,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  makeStyles,
  tokens

} from "@fluentui/react-components";
import { fetchHealth, fetchOutbound, type HealthResult, type OutboundEntry } from "@/lib/client";

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
  row: { display: "flex", alignItems: "center", gap: tokens.spacingHorizontalM },
  metric: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
  },
  caption: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyBase,
  },
  mono: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    overflowWrap: "anywhere",
  },
});

export function OutboundPanel() {
  const styles = useStyles();
  const { theme } = React.useContext(ThemeContext);
  const [health, setHealth] = React.useState<HealthResult | null>(null);
  const [entries, setEntries] = React.useState<OutboundEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const [h, o] = await Promise.all([fetchHealth(), fetchOutbound()]);
      setHealth(h);
      setEntries(o.entries);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 8000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div>
      <h2 className={styles.title}>Outbound log &amp; health</h2>
      <div className={styles.section}>
        <div className={styles.row}>
          {loading || !health ? (
            <Spinner size="small" />
          ) : (
            <MessageBar intent={health.ok ? "success" : "error"} style={{ flexGrow: 1 }}>
              <MessageBarTitle>GET /api/health</MessageBarTitle>
              <MessageBarBody>
                <span className={styles.metric}>
                  ok: {String(health.ok)} · outboundCount: {health.outboundCount}
                </span>
              </MessageBarBody>
            </MessageBar>
          )}
          <Button appearance="secondary" onClick={() => void refresh()}>
            Refresh
          </Button>
        </div>
        <MessageBar intent="info">
          <MessageBarBody>
            Entries are the simulated Slack posts the ported handlers append to the in-memory
            outbound log (e.g. decision replies). They are never sent anywhere — this panel only
            reads them back. Approve, Escalate, or Ignore a hypothesis to add one.
          </MessageBarBody>
        </MessageBar>
      </div>

      {entries.length === 0 ? (
        <span className={styles.caption}>No outbound calls recorded yet.</span>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>#</TableHeaderCell>
              <TableHeaderCell>Destination</TableHeaderCell>
              <TableHeaderCell>Payload</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e, i) => (
              <TableRow key={`${e.url}-${i}`}>
                <TableCell>
                  <span className={styles.caption}>{entries.length - i}</span>
                </TableCell>
                <TableCell>
                  <span className={styles.mono} style={{ fontFamily: theme.fontFamilyMonospace }}>
                    {e.url}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={styles.mono} style={{ fontFamily: theme.fontFamilyMonospace }}>
                    {JSON.stringify(e.body).slice(0, 160)}
                    {JSON.stringify(e.body).length > 160 ? "…" : ""}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
