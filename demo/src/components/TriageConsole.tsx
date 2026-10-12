"use client";

import * as React from "react";
import { ThemeContext } from "../app/providers";
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardHeader,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Skeleton,
  SkeletonItem,
  Spinner,
  Tooltip,
  makeStyles,
  tokens

} from "@fluentui/react-components";
import type { AgentReport, Hypothesis } from "@/logic/types";
import { triageAlert, type DecisionAction, type TriageResult } from "@/lib/client";

const PRESETS = [
  "OOMKilled payments-api",
  "CrashLoopBackOff auth-svc",
  "HighAPIErrorRate checkout-api",
];

const useStyles = makeStyles({
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
  formRow: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    alignItems: "flex-end",
  },
  inputField: { flexGrow: 1 },
  chips: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  cards: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  cardTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
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
  evidence: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalL,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  remediation: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingHorizontalM,
  },
  remediationLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
    marginBottom: tokens.spacingVerticalS,
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  footer: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
  },
});

function HypothesisCard({
  hypothesis,
  incidentId,
  onRequestDecision,
}: {
  hypothesis: Hypothesis;
  incidentId: string;
  onRequestDecision: (h: Hypothesis, incidentId: string, action: DecisionAction) => void;
}) {
  const styles = useStyles();
  const { theme } = React.useContext(ThemeContext);
  const approveDisabled = hypothesis.remediation === "no remediation proposed";
  return (
    <Card>
      <CardHeader
        header={
          <span className={styles.cardTitle}>
            <Badge
              appearance={hypothesis.rank === 1 ? "filled" : "outline"}
              color="brand"
              size="medium"
            >
              #{hypothesis.rank}
            </Badge>{" "}
            {hypothesis.summary}
          </span>
        }
        description={<span className={styles.caption}>Incident {incidentId}</span>}
      />
      <div>
        <div className={styles.remediationLabel}>Evidence</div>
        <ul className={styles.evidence}>
          {hypothesis.evidence.map((e, i) => (
            <li key={i} className={styles.body}>
              {e}
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.remediation}>
        <div className={styles.remediationLabel}>Proposed remediation (dry-run)</div>
        <span
          className={styles.body}
          style={{ fontFamily: theme.fontFamilyMonospace, overflowWrap: "anywhere" }}
        >
          {hypothesis.remediation}
        </span>
      </div>
      <CardFooter>
        <div className={styles.footer}>
          <Tooltip
            content={
              approveDisabled
                ? "No remediation proposed — there is nothing to approve for this hypothesis."
                : "Approve this remediation"
            }
            relationship="label"
          >
            <span style={{ display: "inline-block" }}>
              <Button
                appearance="primary"
                disabled={approveDisabled}
                onClick={() => onRequestDecision(hypothesis, incidentId, "approve")}
              >
                Approve
              </Button>
            </span>
          </Tooltip>
          <Button appearance="secondary" onClick={() => onRequestDecision(hypothesis, incidentId, "escalate")}>
            Escalate
          </Button>
          <Button appearance="subtle" onClick={() => onRequestDecision(hypothesis, incidentId, "ignore")}>
            Ignore
          </Button>
        </div>
      </CardFooter>
    </Card>
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
  const [lastReply, setLastReply] = React.useState<string | null>(null);

  const submit = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    setLoading(true);
    try {
      const res = await onSubmit(t);
      setLastReply(res.slack.body.text ?? null);
    } finally {
      setLoading(false);
    }
  };

  const latest = reports[0] ?? null;

  return (
    <div>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Alert triage</h2>
        <div className={styles.formRow}>
          <Field label="Alert text" className={styles.inputField} hint="What the on-call engineer would type after `/oncall`.">
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
            {loading ? <Spinner size="tiny" /> : "Triage alert"}
          </Button>
        </div>
        <div className={styles.chips}>
          {PRESETS.map((p) => (
            <Button key={p} appearance="outline" size="small" onClick={() => setInput(p)}>
              {p}
            </Button>
          ))}
        </div>
        {lastReply && <span className={styles.caption}>Slack surface reply (ephemeral): “{lastReply}”</span>}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Ranked hypotheses</h2>
        {loading && (
          <div className={styles.section}>
            <div className={styles.loadingRow}>
              <Spinner size="small" />
              <span className={styles.body}>Agent is correlating signals…</span>
            </div>
            <Skeleton aria-label="Loading hypotheses">
              <SkeletonItem shape="rectangle" />
              <SkeletonItem shape="rectangle" />
            </Skeleton>
          </div>
        )}
        {!loading && !latest && (
          <MessageBar intent="info">
            <MessageBarBody>
              No alerts triaged yet. Type an alert above — or flip on the simulated alert stream — to see the
              agent&apos;s ranked hypotheses with evidence and dry-run remediation plans.
            </MessageBarBody>
          </MessageBar>
        )}
        {!loading && latest && (
          <div className={styles.cards}>
            {latest.topHypotheses.map((h) => (
              <HypothesisCard
                key={`${latest.incidentId}-${h.rank}`}
                hypothesis={h}
                incidentId={latest.incidentId}
                onRequestDecision={onRequestDecision}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Re-exported so the page can drive triage from the alert stream too.
export { triageAlert };
