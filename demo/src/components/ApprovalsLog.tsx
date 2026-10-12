"use client";

import * as React from "react";
import { ThemeContext } from "../app/providers";
import {
  Badge,
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
import type { DecisionAction, DecisionRecord } from "@/lib/client";

const useStyles = makeStyles({
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    margin: 0,
    marginBottom: tokens.spacingVerticalM,
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
  body: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
  },
});

const ACTION_BADGE: Record<DecisionAction, "success" | "warning" | "danger"> = {
  approve: "success",
  escalate: "warning",
  ignore: "danger",
};

export function ApprovalsLog({ decisions }: { decisions: DecisionRecord[] }) {
  const styles = useStyles();
  const { theme } = React.useContext(ThemeContext);

  return (
    <div>
      <h2 className={styles.title}>Your decisions</h2>
      {decisions.length === 0 ? (
        <MessageBar intent="info">
          <MessageBarTitle>No decisions recorded yet</MessageBarTitle>
          <MessageBarBody>
            Check an alert, then approve, escalate, or dismiss a proposed fix. Each decision
            lands here with the agent&apos;s exact reply.
          </MessageBarBody>
        </MessageBar>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Time</TableHeaderCell>
              <TableHeaderCell>Incident</TableHeaderCell>
              <TableHeaderCell>Decision</TableHeaderCell>
              <TableHeaderCell>Agent reply</TableHeaderCell>
              <TableHeaderCell>Proposed fix</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decisions.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <span className={styles.caption}>{d.at}</span>
                </TableCell>
                <TableCell>
                  <span className={styles.mono} style={{ fontFamily: theme.fontFamilyMonospace }}>
                    {d.incidentId}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge appearance="tint" color={ACTION_BADGE[d.action]}>
                    {d.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={styles.body}>{d.replyText}</span>
                </TableCell>
                <TableCell>
                  <span className={styles.mono} style={{ fontFamily: theme.fontFamilyMonospace }}>
                    {d.remediation}
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