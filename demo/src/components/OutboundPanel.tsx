"use client";

import * as React from "react";
import { ThemeContext } from "../app/providers";
import {
  Button,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  makeStyles,
  tokens

} from "@fluentui/react-components";
import type { OutboundEntry } from "@/lib/client";

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

// Sent messages & service health — rendered from the visitor's OWN local
// log (localStorage, see lib/localLog.ts), never from the server-side
// in-memory outbound log. That log lives in per-serverless-instance
// memory, so fetching it made this view inconsistent across refreshes
// and could surface another session's entries (QA defect D7). The count
// below is this browser's own entry count, so it is stable across
// refreshes and private to this visitor by construction.
export function OutboundPanel({
  entries,
  onRefresh,
}: {
  entries: OutboundEntry[];
  onRefresh: () => void;
}) {
  const styles = useStyles();
  const { theme } = React.useContext(ThemeContext);

  return (
    <div>
      <h2 className={styles.title}>Sent messages &amp; service health</h2>
      <div className={styles.section}>
        <div className={styles.row}>
          <MessageBar intent="success" style={{ flexGrow: 1 }}>
            <MessageBarTitle>Service health — your log (this browser only)</MessageBarTitle>
            <MessageBarBody>
              <span className={styles.metric}>
                ok: true · outboundCount: {entries.length}
              </span>
            </MessageBarBody>
          </MessageBar>
          <Button appearance="secondary" onClick={onRefresh}>
            Refresh now
          </Button>
        </div>
        <MessageBar intent="info">
          <MessageBarBody>
            These are the messages the agent would send, like decision replies. They are
            simulated and never sent anywhere. Your log is kept in this browser only, so
            it stays the same when you refresh, and no other visitor can see it. Approve,
            escalate, or dismiss a proposed fix to add one.
          </MessageBarBody>
        </MessageBar>
      </div>

      {entries.length === 0 ? (
        <span className={styles.caption}>
          No messages yet. Make a decision on a proposed fix and it will appear here.
        </span>
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
