"use client";

import * as React from "react";
import {
  Button,
  Toast,
  ToastBody,
  ToastTitle,
  makeStyles,
  tokens,
  useToastController,
} from "@fluentui/react-components";
import {
  AlertUrgentRegular,
  CheckmarkCircleRegular,
  KeyRegular,
  PlayRegular,
  SendRegular,
} from "@fluentui/react-icons";
import { Header } from "../components/Header";
import { TriageConsole } from "../components/TriageConsole";
import { ApprovalDialog, type PendingDecision } from "../components/ApprovalDialog";
import { ApprovalsLog } from "../components/ApprovalsLog";
import { SecurityPlayground } from "../components/SecurityPlayground";
import { OutboundPanel } from "../components/OutboundPanel";
import { AlertStream } from "../components/AlertStream";
import {
  recordDecision,
  triageAlert,
  type DecisionAction,
  type DecisionRecord,
  type OutboundEntry,
  type TriageResult,
} from "@/lib/client";
import {
  OUTBOUND_URL,
  isNoRemediation,
  loadDecisions,
  loadOutbound,
  saveDecisions,
  saveOutbound,
} from "@/lib/localLog";
import type { AgentReport, Hypothesis } from "@/logic/types";

type TabId = "triage" | "approvals" | "security" | "outbound" | "stream";

const TABS: { id: TabId; label: string; icon: React.ReactElement }[] = [
  { id: "triage", label: "Triage console", icon: <AlertUrgentRegular /> },
  { id: "approvals", label: "Approval gate", icon: <CheckmarkCircleRegular /> },
  { id: "security", label: "Request security", icon: <KeyRegular /> },
  { id: "outbound", label: "Sent messages", icon: <SendRegular /> },
  { id: "stream", label: "Alert stream", icon: <PlayRegular /> },
];

const useStyles = makeStyles({
  shell: {
    display: "flex",
    minHeight: "100vh",
    "@media (max-width: 768px)": {
      flexDirection: "column",
    },
  },
  nav: {
    flex: "0 0 18%",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRightWidth: tokens.strokeWidthThin,
    borderRightStyle: "solid",
    borderRightColor: tokens.colorNeutralStroke1,
    padding: tokens.spacingVerticalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    "@media (max-width: 768px)": {
      flex: "none",
      flexDirection: "row",
      flexWrap: "wrap",
      borderRightWidth: 0,
      borderBottomWidth: tokens.strokeWidthThin,
      borderBottomStyle: "solid",
      borderBottomColor: tokens.colorNeutralStroke1,
    },
  },
  navLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyBase,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalS,
    "@media (max-width: 768px)": {
      display: "none",
    },
  },
  main: {
    flexGrow: 1,
    padding: tokens.spacingHorizontalL,
    paddingTop: tokens.spacingVerticalL,
    minWidth: 0,
  },
  content: {
    maxWidth: "72rem",
  },
});

const TOAST_INTENT: Record<DecisionAction, "success" | "warning" | "info"> = {
  approve: "success",
  escalate: "warning",
  dismiss: "info",
};

export default function ConsolePage() {
  const styles = useStyles();
  const { dispatchToast } = useToastController();
  const [tab, setTab] = React.useState<TabId>("triage");
  const [reports, setReports] = React.useState<AgentReport[]>([]);
  const [decisions, setDecisions] = React.useState<DecisionRecord[]>([]);
  const [outboundEntries, setOutboundEntries] = React.useState<OutboundEntry[]>([]);
  const [pending, setPending] = React.useState<PendingDecision | null>(null);

  // Per-visitor log (QA defect D7): decisions and their outbound entries
  // live in this visitor's browser (localStorage), not in the API routes'
  // per-instance in-memory log. Hydrate once on mount so the Approval
  // gate and Sent messages survive refreshes and can never show another
  // visitor's entries.
  React.useEffect(() => {
    setDecisions(loadDecisions());
    setOutboundEntries(loadOutbound());
  }, []);

  const refreshLocalLog = React.useCallback(() => {
    setDecisions(loadDecisions());
    setOutboundEntries(loadOutbound());
  }, []);

  const runTriage = React.useCallback(async (text: string): Promise<TriageResult> => {
    const res = await triageAlert(text);
    setReports((prev) => [res.report, ...prev].slice(0, 10));
    return res;
  }, []);

  const handleStreamTriage = React.useCallback(
    async (text: string) => {
      try {
        await runTriage(text);
      } catch {
        // A failed stream-triggered triage must not become an unhandled
        // rejection; the visitor still lands on the triage console.
      }
      setTab("triage");
    },
    [runTriage],
  );

  const requestDecision = React.useCallback(
    (hypothesis: Hypothesis, incidentId: string, action: DecisionAction) => {
      if (action === "approve" && isNoRemediation(hypothesis.remediation)) return;
      setPending({ hypothesis, incidentId, action });
    },
    [],
  );

  const confirmDecision = React.useCallback(
    async (p: PendingDecision) => {
      // Close the dialog synchronously with the click: the record + toast land
      // below, so no second dialog can linger or re-appear during the round-trip.
      setPending(null);
      const res = await recordDecision(p.action, p.incidentId);
      const replyText = res.body.text ?? "(no reply text)";
      const record: DecisionRecord = {
        id: `${Date.now()}-${p.incidentId}-${p.action}`,
        at: new Date().toLocaleString(),
        incidentId: p.incidentId,
        action: p.action,
        replyText,
        remediation: p.hypothesis.remediation,
      };
      // Mirror, in this visitor's browser, the outbound entry the server
      // handler recorded for this decision ({ url, body: { text } }) and
      // persist both logs so they are stable across refreshes (D7).
      const entry: OutboundEntry = { url: OUTBOUND_URL, body: { text: replyText } };
      const nextDecisions = [record, ...decisions];
      const nextOutbound = [entry, ...outboundEntries];
      setDecisions(nextDecisions);
      setOutboundEntries(nextOutbound);
      saveDecisions(nextDecisions);
      saveOutbound(nextOutbound);
      dispatchToast(
        <Toast>
          <ToastTitle>Decision recorded — {p.action}</ToastTitle>
          <ToastBody>{replyText}</ToastBody>
        </Toast>,
        { intent: TOAST_INTENT[p.action] },
      );
    },
    [dispatchToast, decisions, outboundEntries],
  );

  return (
    <div>
      <Header />
      <div className={styles.shell}>
        <nav className={styles.nav} aria-label="Console sections">
          <span className={styles.navLabel}>SENTINEL</span>
          {TABS.map((t) => (
            <Button
              key={t.id}
              appearance={tab === t.id ? "secondary" : "transparent"}
              icon={t.icon}
              onClick={() => setTab(t.id)}
              style={{ justifyContent: "flex-start" }}
            >
              {t.label}
            </Button>
          ))}
        </nav>
        <main className={styles.main}>
          <div className={styles.content}>
            {tab === "triage" && (
              <TriageConsole reports={reports} onSubmit={runTriage} onRequestDecision={requestDecision} />
            )}
            {tab === "approvals" && <ApprovalsLog decisions={decisions} />}
            {tab === "security" && <SecurityPlayground />}
            {tab === "outbound" && (
              <OutboundPanel entries={outboundEntries} onRefresh={refreshLocalLog} />
            )}
            {tab === "stream" && <AlertStream onTriageText={handleStreamTriage} />}
          </div>
        </main>
      </div>
      <ApprovalDialog pending={pending} onClose={() => setPending(null)} onConfirm={confirmDecision} />
    </div>
  );
}