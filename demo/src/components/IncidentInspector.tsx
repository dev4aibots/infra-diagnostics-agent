"use client";

import * as React from "react";
import { ThemeContext } from "../app/providers";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  MessageBar,
  MessageBarBody,
  Tooltip,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import type { Hypothesis } from "@/logic/types";
import type { DecisionAction } from "@/lib/client";
import { isNoRemediation } from "@/lib/localLog";

// Inspector side panel: the full breakdown of the selected likely cause.
// Lives next to the ranked feed; everything here is a read of the report,
// the three action buttons drive the same approval flow as before.
const useStyles = makeStyles({
  panel: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    padding: tokens.spacingHorizontalL,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    position: "sticky",
    top: tokens.spacingVerticalL,
  },
  heading: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    margin: 0,
  },
  caption: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyBase,
    overflowWrap: "anywhere",
  },
  summaryRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
  },
  summary: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
  },
  sectionLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: tokens.spacingVerticalS,
  },
  evidence: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalL,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
  },
  plan: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    overflowWrap: "anywhere",
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
    paddingTop: tokens.spacingVerticalS,
    borderTopWidth: tokens.strokeWidthThin,
    borderTopStyle: "solid",
    borderTopColor: tokens.colorNeutralStroke1,
  },
});

export function IncidentInspector({
  incidentId,
  alertText,
  hypothesis,
  onRequestDecision,
}: {
  incidentId: string | null;
  alertText: string | null;
  hypothesis: Hypothesis | null;
  onRequestDecision: (h: Hypothesis, incidentId: string, action: DecisionAction) => void;
}) {
  const styles = useStyles();
  const { theme } = React.useContext(ThemeContext);

  if (!incidentId || !hypothesis) {
    return (
      <aside className={styles.panel} aria-label="Incident inspector">
        <h3 className={styles.heading}>Inspector</h3>
        <MessageBar intent="info">
          <MessageBarBody>
            Check an alert and pick a likely cause from the feed. The full breakdown,
            evidence, and the fix to approve appear here.
          </MessageBarBody>
        </MessageBar>
      </aside>
    );
  }

  // QA defect D9: with no remediation proposed there is no fix to approve.
  const approveDisabled = isNoRemediation(hypothesis.remediation);

  return (
    <aside className={styles.panel} aria-label="Incident inspector">
      <div>
        <h3 className={styles.heading}>Incident {incidentId}</h3>
        {alertText && <div className={styles.caption}>Alert: {alertText}</div>}
      </div>
      <div className={styles.summaryRow}>
        <Badge appearance={hypothesis.rank === 1 ? "filled" : "outline"} color="brand" size="medium">
          #{hypothesis.rank}
        </Badge>
        <span className={styles.summary}>{hypothesis.summary}</span>
      </div>
      <div>
        <div className={styles.sectionLabel}>Why the agent thinks so</div>
        <ul className={styles.evidence}>
          {hypothesis.evidence.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
      <div>
        <div className={styles.sectionLabel}>Proposed fix (nothing runs yet)</div>
        <div className={styles.plan} style={{ fontFamily: theme.fontFamilyMonospace }}>
          {hypothesis.remediation}
        </div>
      </div>
      <div className={styles.actions}>
        <Tooltip
          content={
            approveDisabled
              ? "No fix proposed, so there is nothing to approve for this cause."
              : "Approve this fix"
          }
          relationship="label"
        >
          <span style={{ display: "inline-block" }}>
            <Button
              appearance="primary"
              disabled={approveDisabled}
              aria-disabled={approveDisabled}
              onClick={() => onRequestDecision(hypothesis, incidentId, "approve")}
            >
              Approve fix
            </Button>
          </span>
        </Tooltip>
        <Button appearance="secondary" onClick={() => onRequestDecision(hypothesis, incidentId, "escalate")}>
          Escalate
        </Button>
        <Button appearance="subtle" onClick={() => onRequestDecision(hypothesis, incidentId, "dismiss")}>
          Dismiss
        </Button>
      </div>
      {approveDisabled ? (
        <span className={styles.caption}>
          No fix proposed for this cause, so Approve fix is disabled — Escalate or
          Dismiss instead.
        </span>
      ) : (
        <span className={styles.caption}>
          Approving opens a confirmation first. Nothing runs without your say-so.
        </span>
      )}
    </aside>
  );
}