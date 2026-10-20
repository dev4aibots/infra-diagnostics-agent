"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Skeleton,
  SkeletonItem,
  Spinner,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import type { AgentReport, Hypothesis } from "@/logic/types";
import { triageAlert, type DecisionAction, type TriageResult } from "@/lib/client";
import { IncidentInspector } from "./IncidentInspector";

const PRESETS = [
  "OOMKilled payments-api",
  "CrashLoopBackOff auth-svc",
  "HighAPIErrorRate checkout-api",
];

const useStyles = makeStyles({
  story: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    padding: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalL,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  storyTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    margin: 0,
  },
  storyBody: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
    margin: 0,
    maxWidth: "75ch",
    lineHeight: tokens.lineHeightBase300,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalL,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    margin: 0,
  },
  sectionGloss: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
    margin: 0,
  },
  formRow: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    alignItems: "flex-end",
    "@media (max-width: 640px)": {
      flexDirection: "column",
      alignItems: "stretch",
    },
  },
  inputField: { flexGrow: 1 },
  chips: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
    alignItems: "center",
  },
  chipsLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyBase,
  },
  caption: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyBase,
  },
  body: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
  },
  // Ops-console layout: animated ranked feed + inspector side panel.
  consoleGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 7fr) minmax(0, 5fr)",
    gap: tokens.spacingHorizontalL,
    alignItems: "start",
    "@media (max-width: 960px)": {
      gridTemplateColumns: "1fr",
    },
  },
  feed: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  // Feed rows choreograph in on mount (pattern after Magic UI animated-list,
  // MIT): transform/opacity only, token durations/easings, stagger capped at 8.
  feedRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    padding: tokens.spacingHorizontalM,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    animationName: "sentinel-feed-in",
    animationDuration: tokens.durationSlow,
    animationTimingFunction: tokens.curveDecelerateMid,
    animationFillMode: "both",
    ":hover": {
      boxShadow: tokens.shadow4,
    },
  },
  feedRowSelected: {
    backgroundColor: tokens.colorNeutralBackground3,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorBrandStroke1}`,
  },
  feedSummary: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    flexGrow: 1,
  },
  feedMeta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyBase,
    whiteSpace: "nowrap",
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
});

function FeedKeyframes() {
  return (
    <style>{`@keyframes sentinel-feed-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } } @media (prefers-reduced-motion: reduce) { .sentinel-feed-row { animation: none !important; } }`}</style>
  );
}

export function TriageConsole({
  reports,
  onSubmit,
  onRequestDecision,
}: {
  reports: AgentReport[];
  onSubmit: (text: string) => Promise<TriageResult>;
  onRequestDecision: (h: Hypothesis, incidentId: string, action: DecisionAction) => void;
}) {
  const styles = useStyles();
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [triageError, setTriageError] = React.useState<string | null>(null);
  const [lastReply, setLastReply] = React.useState<string | null>(null);
  const [alertTexts, setAlertTexts] = React.useState<Record<string, string>>({});
  const [selectedRank, setSelectedRank] = React.useState<number>(1);

  const submit = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    setLoading(true);
    setTriageError(null);
    try {
      const res = await onSubmit(t);
      setLastReply(res.slack.body.text ?? null);
      setAlertTexts((prev) => ({ ...prev, [res.report.incidentId]: t }));
      setSelectedRank(1);
    } catch {
      // QA defect D8: a failed triage fetch used to revert silently to the
      // empty state. Surface an inline error the visitor can act on.
      setTriageError("Diagnosis failed — try again.");
    } finally {
      setLoading(false);
    }
  };

  const latest = reports[0] ?? null;
  const selected: Hypothesis | null =
    latest?.topHypotheses.find((h) => h.rank === selectedRank) ??
    latest?.topHypotheses[0] ??
    null;

  return (
    <div>
      <FeedKeyframes />
      <div className={styles.story}>
        <h2 className={styles.storyTitle}>Your infrastructure explains itself before it breaks</h2>
        <p className={styles.storyBody}>
          This is a simulated on-call console. Paste an alert and the agent ranks the likely
          causes with evidence, then proposes a fix. You approve before anything runs, and
          nothing here touches a real cluster. Start by typing an alert below.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Check an alert</h2>
        <div className={styles.formRow}>
          <Field
            label="Alert text"
            className={styles.inputField}
            hint="Paste what the alert says, the way your monitoring would report it."
          >
            <Input
              value={input}
              onChange={(_, d) => setInput(d.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit(input);
              }}
              placeholder="e.g. OOMKilled payments-api"
            />
          </Field>
          <Button appearance="primary" disabled={loading || !input.trim()} onClick={() => void submit(input)}>
            {loading ? <Spinner size="tiny" /> : "Diagnose alert"}
          </Button>
        </div>
        <div className={styles.chips}>
          <span className={styles.chipsLabel}>Try a sample:</span>
          {PRESETS.map((p) => (
            <Button key={p} appearance="outline" size="small" onClick={() => setInput(p)}>
              {p}
            </Button>
          ))}
        </div>
        {lastReply && (
          <span className={styles.caption}>The agent would reply in Slack: &ldquo;{lastReply}&rdquo;</span>
        )}
        {triageError && (
          <MessageBar intent="error" role="alert">
            <MessageBarTitle>Diagnosis failed — try again</MessageBarTitle>
            <MessageBarBody>
              {triageError} The alert could not be diagnosed — check your connection and
              press &ldquo;Diagnose alert&rdquo; again.
            </MessageBarBody>
          </MessageBar>
        )}
      </div>

      <div className={styles.section}>
        <div>
          <h2 className={styles.sectionTitle}>Likely causes, ranked</h2>
          <p className={styles.sectionGloss}>
            What the agent thinks is wrong, best guess first. Pick one to inspect it.
          </p>
        </div>
        {loading && (
          <div className={styles.section}>
            <div className={styles.loadingRow}>
              <Spinner size="small" />
              <span className={styles.body}>Reading the alert and weighing the evidence&hellip;</span>
            </div>
            <Skeleton aria-label="Loading likely causes">
              <SkeletonItem shape="rectangle" />
              <SkeletonItem shape="rectangle" />
            </Skeleton>
          </div>
        )}
        {!loading && !latest && !triageError && (
          <MessageBar intent="info">
            <MessageBarTitle>No alerts checked yet</MessageBarTitle>
            <MessageBarBody>
              Paste an alert above, or start the simulated alert stream, and the agent will list
              likely causes with evidence and a proposed fix for each.
            </MessageBarBody>
          </MessageBar>
        )}
        {!loading && latest && (
          <div className={styles.consoleGrid}>
            <div className={styles.feed} role="listbox" aria-label="Ranked likely causes">
              {latest.topHypotheses.map((h, i) => (
                <button
                  key={`${latest.incidentId}-${h.rank}`}
                  type="button"
                  role="option"
                  aria-selected={selected?.rank === h.rank}
                  className={mergeClasses(
                    styles.feedRow,
                    "sentinel-feed-row",
                    selected?.rank === h.rank && styles.feedRowSelected,
                  )}
                  style={{ animationDelay: `${Math.min(i, 7) * 0.06}s` }}
                  onClick={() => setSelectedRank(h.rank)}
                >
                  <Badge appearance={h.rank === 1 ? "filled" : "outline"} color="brand" size="medium">
                    #{h.rank}
                  </Badge>
                  <span className={styles.feedSummary}>{h.summary}</span>
                  <span className={styles.feedMeta}>{h.evidence.length} piece{h.evidence.length === 1 ? "" : "s"} of evidence</span>
                </button>
              ))}
            </div>
            <IncidentInspector
              incidentId={latest.incidentId}
              alertText={alertTexts[latest.incidentId] ?? null}
              hypothesis={selected}
              onRequestDecision={onRequestDecision}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Re-exported so the page can drive triage from the alert stream too.
export { triageAlert };