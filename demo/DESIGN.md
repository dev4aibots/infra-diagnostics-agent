# DESIGN.md — infra-diagnostics-agent demo ("Sentinel console")

> Design-token source of truth for the Microsoft Fluent 2 build.
> Template modeled on `primer/primitives`' `DESIGN_TOKENS_GUIDE.md` (logic/rules document).
> Component facts live in `fluent-playbook.md`. **Rule: never use raw values (hex, px, ms) — only the semantic tokens below.** (One exception: the single react-bits hero element, see §7.)

## 1. Design intent

A Microsoft Azure-portal / M365-admin surface for an infrastructure alert-triage agent.
Reads as a *real Microsoft product*, not a themed clone. Professional, dense, calm.
Information hierarchy does the impressing — not decoration.

## 2. Core rule

You are a CSS expert. **Never use raw values (hex, px, etc.). Only use semantic tokens** —
in Griffel (`makeStyles`) that means `tokens.*`; in Fluent props that means token-backed
appearances/intents. If a value has no token, the design is wrong, not the token set.

## 3. Color pairings (MUST rules)

| Background token | Foreground token | Notes |
|---|---|---|
| `colorNeutralBackground1` | `colorNeutralForeground1` | Standard surface + body text. MUST pair. |
| `colorNeutralBackground2/3` | `colorNeutralForeground1/2` | Layered cards, hover rows. |
| `colorBrandBackground` | `colorNeutralForegroundOnBrand` | Primary buttons. MUST pair. |
| `colorStatusDangerBackground1` | `colorStatusDangerForeground3` (or NeutralForeground1) | MUST use readable fg on tinted bg. |
| `colorStatusSuccessBackground1` / `colorStatusWarningBackground1` | matching status foreground / NeutralForeground1 | Same rule. |
| `colorNeutralBackgroundSelected` | `colorNeutralForeground1` | Selected grid rows. |

Contrast: normal text ≥ 4.5:1, large text/UI ≥ 3:1 (WCAG AA). Fluent's built-in pairings
already satisfy this — do not invent custom fg/bg combos.

## 4. Type scale (Fluent v9 tokens, verified in `@fluentui/tokens`)

| Role | Token (size / weight) | Usage |
|---|---|---|
| Page title | `fontSizeHero700` / `fontWeightSemibold` | One per surface, max. |
| Section title | `fontSizeBase600` / `fontWeightSemibold` | Card headers, dialog titles. |
| Subtitle | `fontSizeBase500` / `fontWeightSemibold` | Hypothesis card titles. |
| Body | `fontSizeBase300` / `fontWeightRegular` | Default text. |
| Body large | `fontSizeBase400` / `fontWeightRegular` | Key metric readouts. |
| Caption | `fontSizeBase200` / `fontWeightRegular` | Timestamps, helper text, log metadata. |
| Emphasis | `fontWeightMedium` | Inline emphasis inside body text. |

Font: `fontFamilyBase` everywhere. Monospace (log output, signatures): use the theme's
monospace stack — do not hardcode a font name; read it from the theme object.

## 5. Spacing, radius, elevation

### Spacing
| Token | Value class | Usage |
|---|---|---|
| `spacingHorizontalS` / `spacingVerticalS` | tight | inside badges, chips, icon gaps |
| `spacingHorizontalM` / `spacingVerticalM` | default | card padding, grid row gaps |
| `spacingHorizontalL` / `spacingVerticalL` | loose | page gutters, dialog padding |

Gaps between stacked sections: `spacingVerticalL`. Card internal rhythm: `M`.

### Radius
| Token | Usage |
|---|---|
| `borderRadiusSmall` | inputs, small buttons, badges |
| `borderRadiusMedium` | cards, list rows |
| `borderRadiusLarge` | dialogs |
| `borderRadiusXLarge` | hero/large surfaces only |

### Elevation
| Token | Usage |
|---|---|
| `shadow2` | resting cards |
| `shadow4` | hover cards, small popovers |
| `shadow8` | menus, dropdowns |
| `shadow16` | dialogs |
| `shadow28` | toasts, topmost overlays |

Borders: `strokeWidthThin` + `colorNeutralStroke1`; stronger separation: `colorNeutralStroke2`.

## 6. Motion rules

| Rule | Detail |
|---|---|
| MUST | Use `duration*`/`curve*` tokens for all transitions. |
| MUST | Interactive state changes ≤ `durationNormal` (200ms). |
| MUST | Enter = `curveDecelerateMid`, exit = `curveAccelerateMid`, standard = `curveEasyEase`. |
| MUST | Respect `prefers-reduced-motion`. |
| MUST NOT | Animate layout-affecting properties on the alert grid (perf). Opacity/transform only. |
| MUST NOT | Decorative looping animation anywhere except the single §7 hero element. |

Token values (v9 defaults): `durationUltraFast` 50ms · `durationFaster` 100ms ·
`durationFast` 150ms · `durationNormal` 200ms · `durationGentle` 250ms · `durationSlow` 300ms.

## 7. Wow layer — ONE element, restrained (react-bits)

Repo: `DavidHDev/react-bits` (48,965 stars, active; license field via GitHub API returned
`NOASSERTION` — the demo playbook asserts MIT + Commons Clause. **Builder: re-verify the
license text in the repo before copying code.**)

**Recommendation: `ShinyText` on the product wordmark in the top header bar only**
(`src/ts-default/TextAnimations/ShinyText`). A slow, subtle shimmer across "Sentinel" —
reads as polish, not carnival. Everything else on all five surfaces stays pure Fluent v9.
No backgrounds, no particle systems, no scroll animations: an Azure-portal console with a
Galaxy background would fail the `admud/taste-index` `04-critique.md` taste gate instantly,
and an HR would read it as unserious.

If in doubt during QA: drop ShinyText → "none". A pure-Fluent console is always acceptable;
a decorated one is a risk.

## 8. Per-surface token application

1. **Alert console** — page bg `colorNeutralBackground2`, table cards `colorNeutralBackground1`
   `shadow2`; severity Badges: `color="danger|warning|brand"` filled; selected rows
   `colorNeutralBackgroundSelected`; section titles Base600/semibold.
2. **Hypothesis cards** — `Card` `colorNeutralBackground1`, `borderRadiusMedium`, `shadow4` on
   hover; confidence `ProgressBar` brand; status Badge tint appearance.
3. **Approval dialog** — `DialogSurface` (shadow16, radius large); risk `MessageBar
   intent="warning"`; destructive action Button `appearance="primary"` in danger color
   only via `colorPaletteRedBackground3`-backed styling — prefer Fluent's semantic props.
4. **Signature playground** — tab strip `TabList appearance="transparent"`; preview `Card`
   `colorNeutralBackground3`; monospace signature text; result `Toast` intent success/error.
5. **Outbound log** — `Table` on `colorNeutralBackground1`; status Badges tint;
   caption-size timestamps (`fontSizeBase200`, `colorNeutralForeground3`); streaming rows
   `SkeletonItem` while loading.

## 9. Dark mode

Swap `FluentProvider theme` between `webLightTheme` and `webDarkTheme`. All styling via
`tokens.*` adapts automatically — **do not branch colors manually**. Set `<body>` background
per theme yourself (FluentProvider does not). Test every surface in both themes before QA.

## 10. Anti-patterns (will fail review)

- Hardcoded hex/px anywhere in Griffel styles.
- Hand-rolled buttons/cards/badges that mimic Fluent — always import the real component.
- v8 habits: `<Stack>`, `mergeStyleSets`, `@fluentui/react` imports.
- More than one react-bits element per page; any looping background animation.
- Custom fg/bg color combos that break the §3 pairing table.
