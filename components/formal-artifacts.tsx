import { decideFutureOfferAction } from "@/app/actions";
import { FmBadge } from "@/components/fm-ui/FmBadge";
import { FmCard } from "@/components/fm-ui/FmCard";
import { FmIcon } from "@/components/fm-ui/FmScaffold";
import type { FormalArtifact } from "@/lib/demo/formal-artifacts";
import {
  sanitizePlayerFacingText,
  sanitizePlayerFacingTextList,
} from "@/lib/player-facing-text";

function iconNameForArtifact(kind: FormalArtifact["kind"]) {
  switch (kind) {
    case "scholarship":
      return "chart" as const;
    case "competition":
      return "trophy" as const;
    case "internship":
      return "briefcase" as const;
    case "recommendation":
    case "postgraduate":
      return "book" as const;
    case "employment":
      return "briefcase" as const;
    default:
      return "file" as const;
  }
}

const emotionalStages = ["等待", "揭晓", "被认可", "回看付出", "留下纪念"] as const;

function artifactTypeLabel(kind: FormalArtifact["kind"]) {
  switch (kind) {
    case "scholarship":
      return "奖学金结果";
    case "competition":
      return "竞赛成果";
    case "internship":
      return "实习经历";
    case "recommendation":
      return "推免结果";
    case "postgraduate":
      return "考研结果";
    case "employment":
      return "就业结果";
    default:
      return "正式成果";
  }
}

function EmotionalStageRail() {
  return (
    <div className="fm-formal-stage">
      <div className="fm-formal-stage__label">这份结果走到这里</div>
      <ol className="fm-emotion-rail" aria-label="正式成果阶段">
        {emotionalStages.map((stage) => (
          <li key={stage}>{stage}</li>
        ))}
      </ol>
    </div>
  );
}

function dedupeArtifacts(artifacts: FormalArtifact[]) {
  const unique = new Map<string, FormalArtifact>();

  for (const artifact of artifacts) {
    const key =
      artifact.id ||
      `${artifact.kind}-${artifact.offerId ?? artifact.serialNumber}-${artifact.monthIndex}-${artifact.title}`;

    if (!unique.has(key)) {
      unique.set(key, artifact);
    }
  }

  return [...unique.values()];
}

function renderOfferActions(runId: string, artifact: FormalArtifact) {
  if (!artifact.offerId || artifact.accepted || artifact.rejected) {
    return null;
  }

  return (
    <div className="fm-offer-actions">
      <form action={decideFutureOfferAction}>
        <input type="hidden" name="runId" value={runId} />
        <input type="hidden" name="offerId" value={artifact.offerId} />
        <input type="hidden" name="decision" value="accept" />
        <button type="submit" className="fm-button-primary">
          收进履历
        </button>
      </form>
      <form action={decideFutureOfferAction}>
        <input type="hidden" name="runId" value={runId} />
        <input type="hidden" name="offerId" value={artifact.offerId} />
        <input type="hidden" name="decision" value="reject" />
        <button type="submit" className="fm-button-secondary">
          留作纪念
        </button>
      </form>
    </div>
  );
}

export function FormalArtifactCards({
  artifacts,
  runId,
  showOfferActions = false,
}: {
  artifacts: FormalArtifact[];
  runId?: string;
  showOfferActions?: boolean;
}) {
  const visibleArtifacts = dedupeArtifacts(artifacts);

  return (
    <div className="fm-formal-grid">
      {visibleArtifacts.map((artifact, index) => {
        const facts = sanitizePlayerFacingTextList(artifact.facts);
        const title = sanitizePlayerFacingText(artifact.title);
        const subtitle = sanitizePlayerFacingText(artifact.subtitle);
        const summary = sanitizePlayerFacingText(artifact.summary);
        const issuer = sanitizePlayerFacingText(artifact.issuer);
        const badgeLabel = sanitizePlayerFacingText(artifact.badgeLabel);
        const sealLabel = sanitizePlayerFacingText(artifact.sealLabel);
        const periodLabel = sanitizePlayerFacingText(artifact.periodLabel);

        return (
          <FmCard
            key={
              artifact.id ||
              `${artifact.kind}-${artifact.offerId ?? artifact.serialNumber ?? runId ?? "artifact"}-${artifact.monthIndex ?? index}-${index}`
            }
            variant={artifact.kind === "employment" || artifact.kind === "recommendation" || artifact.kind === "postgraduate" ? "active" : "normal"}
            className="fm-formal-card"
          >
            <div className="fm-formal-card__head">
              <div className={`fm-inline-stat__icon tone-${artifact.badgeTone}`}>
                <FmIcon name={iconNameForArtifact(artifact.kind)} />
              </div>
              <div className="fm-formal-card__meta">
                <div className="fm-formal-card__eyebrow">{artifactTypeLabel(artifact.kind)}</div>
                <h3 className="fm-formal-card__title">{title}</h3>
                <p className="fm-formal-card__subtitle">
                  {periodLabel}
                  {subtitle ? ` · ${subtitle}` : ""}
                </p>
              </div>
              <FmBadge tone={artifact.badgeTone}>{badgeLabel}</FmBadge>
            </div>

            <p className="fm-formal-card__summary">{summary}</p>

            {facts.length > 0 ? (
              <div className="fm-formal-card__facts">
                {facts.map((fact) => (
                  <span key={`${artifact.id}-${fact}`} className="fm-timeline-tag">
                    {fact}
                  </span>
                ))}
              </div>
            ) : null}

            <EmotionalStageRail />

            <div className="fm-formal-card__foot">
              <span>{issuer}</span>
              <span>{sealLabel}</span>
              <span>{artifact.serialNumber}</span>
            </div>

            {showOfferActions && runId ? renderOfferActions(runId, artifact) : null}
          </FmCard>
        );
      })}
    </div>
  );
}

export function FormalDocumentPreview({
  artifact,
  recipientName,
}: {
  artifact: FormalArtifact;
  recipientName: string;
}) {
  const title = sanitizePlayerFacingText(artifact.title);
  const subtitle = sanitizePlayerFacingText(artifact.subtitle);
  const summary = sanitizePlayerFacingText(artifact.summary);
  const badgeLabel = sanitizePlayerFacingText(artifact.badgeLabel);
  const sealLabel = sanitizePlayerFacingText(artifact.sealLabel);
  const issuer = sanitizePlayerFacingText(artifact.issuer);
  const periodLabel = sanitizePlayerFacingText(artifact.periodLabel);

  return (
    <div className="fm-formal-doc-scene">
      <aside className="fm-side-sheet">
        <div className="fm-brand-mark">Freshmanto</div>
        <div className="mt-6 fm-stack">
          <div className="fm-stat-card">
            <div className="fm-stat-card__label">结果类型</div>
            <div className="fm-stat-card__value">{title}</div>
            <div className="fm-stat-card__copy">{subtitle}</div>
          </div>
          <div className="fm-stat-card">
            <div className="fm-stat-card__label">归档时间</div>
            <div className="fm-stat-card__value">{periodLabel}</div>
            <div className="fm-stat-card__copy">{artifact.serialNumber}</div>
          </div>
          <div className="fm-stat-card">
            <div className="fm-stat-card__label">现在留下的是</div>
            <div className="fm-stat-card__value">{sealLabel}</div>
            <div className="fm-stat-card__copy">{issuer}</div>
          </div>
        </div>
      </aside>

      <section className="fm-document-card">
        <div className="fm-admission-header">
          <div>
            <div className="fm-admission-brand-cn">Freshmanto 成果归档中心</div>
            <div className="fm-admission-brand-en">FRESHMANTO RECORD OFFICE</div>
          </div>
          <div className="fm-admission-seal">{sealLabel}</div>
        </div>

        <div className="fm-admission-rule" />
        <h2 className="fm-admission-title">{title}</h2>
        <div className="fm-admission-number">编号：{artifact.serialNumber}</div>

        <div className="fm-letter">
          <p>
            <strong>{recipientName}</strong>：
          </p>
          <p>{summary}</p>
          <p>
            这份档案只整理已经发生的结果，不会替你多写没出现过的录取、录用或奖项。
            下面这些信息，代表它已经被认真留了下来。
          </p>
        </div>

        <EmotionalStageRail />

        <div className="fm-admission-footer">
          <div className="fm-info-box">
            <table>
              <tbody>
                <tr>
                  <td>归档时间</td>
                  <td>{periodLabel}</td>
                </tr>
                <tr>
                  <td>结果类型</td>
                  <td>{badgeLabel}</td>
                </tr>
                <tr>
                  <td>签发单位</td>
                  <td>{issuer}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="fm-signature">
            <div>Freshmanto Records</div>
            <div className="mt-2">{sealLabel}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
