"use client";

import * as React from "react";
import { ThemeContext } from "../app/providers";
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  tokens

} from "@fluentui/react-components";
import type { Hypothesis } from "@/logic/types";
import type { DecisionAction } from "@/lib/client";

const useStyles = makeStyles({
  content: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  sectionLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
    marginBottom: tokens.spacingVerticalS,
  },
  plan: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    overflowWrap: "anywhere",
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
  caption: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyBase,
  },
  row: { display: "flex", alignItems: "center", gap: tokens.spacingHorizontalS },
  // DESIGN.md §8: destructive confirm via a red-backed treatment.
  dangerConfirm: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
    ":hover": { backgroundColor: tokens.colorPaletteRedBackground3 },
  },
});

const ACTION_META: Record<DecisionAction, { label: string; confirm: string; badge: "success" | "warning" | "danger" }> = {
  approve: { label: "Approve", confirm: "Approve remediation", badge: "success" },
  escalate: { label: "Escalate", confirm: "Escalate to on-call", badge: "warning" },
  ignore: { label: "Ignore", confirm: "Ignore incident", badge: "danger" },
};

export type PendingDecision = {
  hypothesis: Hypothesis;
  incidentId: string;
  action: DecisionAction;
};

export function ApprovalDialog({
  pending,
  onClose,
  onConfirm,
}: {
  pending: PendingDecision | null;
  onClose: () => void;
  onConfirm: (p: PendingDecision) => void;
}) {
  const styles = useStyles();
  const { theme } = React.useContext(ThemeContext);
  const meta = pending ? ACTION_META[pending.action] : null;

  return (
    <Dialog
      open={pending !== null}
      onOpenChange={(_, d) => {
        if (!d.open) onClose();
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Confirm decision</DialogTitle>
          <DialogContent className={styles.content}>
            {pending && meta && (
              <>
                <div className={styles.row}>
                  <Badge appearance="tint" color={meta.badge}>
                    {meta.label}
                  </Badge>
                  <span className={styles.caption}>Incident {pending.incidentId}</span>
                </div>
                <MessageBar intent="warning">
                  <MessageBarTitle>SIMULATED — dry run only</MessageBarTitle>
                  <MessageBarBody>
                    No cluster is connected and nothing will execute. This dialog shows the exact
                    remediation plan that would run after verified human approval.
                  </MessageBarBody>
                </MessageBar>
                <div>
                  <div className={styles.sectionLabel}>Remediation plan (dry-run)</div>
                  <div className={styles.plan} style={{ fontFamily: theme.fontFamilyMonospace }}>
                    {pending.hypothesis.remediation}
                  </div>
                </div>
                <div>
                  <div className={styles.sectionLabel}>Supporting evidence</div>
                  <ul className={styles.evidence}>
                    {pending.hypothesis.evidence.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              className={pending?.action === "ignore" ? styles.dangerConfirm : undefined}
              onClick={() => pending && onConfirm(pending)}
            >
              {meta?.confirm ?? "Confirm"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
