import { decideFutureOfferAction } from "@/app/actions";
import { FmBadge } from "@/components/fm-ui/FmBadge";
import { FmCard } from "@/components/fm-ui/FmCard";
import { FmIcon } from "@/components/fm-ui/FmScaffold";
import type { FormalArtifact } from "@/lib/demo/formal-artifacts";

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

function EmotionalStageRail() {
  return (
    <ol className="fm-emotion-rail" aria-label="重要结果情绪阶段">
      {emotionalStages.map((stage) => (
        <li key={stage}>{stage}</li>
      ))}
    </ol>
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
      {visibleArtifacts.map((artifact, index) => (
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
              <div className="fm-formal-card__eyebrow">{artifact.periodLabel}</div>
              <h3 className="fm-formal-card__title">{artifact.title}</h3>
              <p className="fm-formal-card__subtitle">{artifact.subtitle}</p>
            </div>
            <FmBadge tone={artifact.badgeTone}>{artifact.badgeLabel}</FmBadge>
          </div>
          <p className="fm-formal-card__summary">{artifact.summary}</p>
          <EmotionalStageRail />
          <div className="fm-formal-card__facts">
            {artifact.facts.map((fact) => (
              <span key={`${artifact.id}-${fact}`} className="fm-timeline-tag">
                {fact}
              </span>
            ))}
          </div>
          <div className="fm-formal-card__foot">
            <span>{artifact.issuer}</span>
            <span>{artifact.serialNumber}</span>
          </div>
          {showOfferActions && runId && artifact.offerId && !artifact.accepted && !artifact.rejected ? (
            <div className="fm-offer-actions">
              <form action={decideFutureOfferAction}>
                <input type="hidden" name="runId" value={runId} />
                <input type="hidden" name="offerId" value={artifact.offerId} />
                <input type="hidden" name="decision" value="accept" />
                <button type="submit" className="fm-button-primary">
                  {artifact.offerType === "employment"
                    ? "选择这个 offer"
                    : artifact.offerType === "recommendation"
                      ? "接受这份推免"
                      : "接受这份录取"}
                </button>
              </form>
              <form action={decideFutureOfferAction}>
                <input type="hidden" name="runId" value={runId} />
                <input type="hidden" name="offerId" value={artifact.offerId} />
                <input type="hidden" name="decision" value="reject" />
                <button type="submit" className="fm-button-secondary">
                  {artifact.offerType === "employment" ? "继续看看别的选择" : "暂时放下，继续看看"}
                </button>
              </form>
            </div>
          ) : null}
        </FmCard>
      ))}
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
  return (
    <div className="fm-formal-doc-scene">
      <aside className="fm-side-sheet">
        <div className="fm-brand-mark">Freshmanto</div>
        <div className="mt-6 fm-stack">
          <div className="fm-stat-card">
            <div className="fm-stat-card__label">文件类型</div>
            <div className="fm-stat-card__value">{artifact.title}</div>
            <div className="fm-stat-card__copy">{artifact.subtitle}</div>
          </div>
          <div className="fm-stat-card">
            <div className="fm-stat-card__label">归档编号</div>
            <div className="fm-stat-card__value">{artifact.serialNumber}</div>
            <div className="fm-stat-card__copy">{artifact.periodLabel}</div>
          </div>
          <div className="fm-stat-card">
            <div className="fm-stat-card__label">结果状态</div>
            <div className="fm-stat-card__value">{artifact.sealLabel}</div>
            <div className="fm-stat-card__copy">{artifact.issuer}</div>
          </div>
        </div>
      </aside>

      <section className="fm-document-card">
        <div className="fm-admission-header">
          <div>
            <div className="fm-admission-brand-cn">Freshmanto 成果归档中心</div>
            <div className="fm-admission-brand-en">FRESHMANTO RECORD OFFICE</div>
          </div>
          <div className="fm-admission-seal">{artifact.sealLabel}</div>
        </div>

        <div className="fm-admission-rule" />
        <h2 className="fm-admission-title">{artifact.title}</h2>
        <div className="fm-admission-number">编号：{artifact.serialNumber}</div>

        <div className="fm-letter">
          <p>
            <strong>{recipientName}</strong>：
          </p>
          <p>{artifact.summary}</p>
          <p>
            该结果页仅根据当前存档中已结算的规则层事实生成，不补写未发生的奖项、录取或录用信息。
            以下归档信息可作为这段阶段性结果的正式留痕。
          </p>
        </div>

        <EmotionalStageRail />

        <div className="fm-admission-footer">
          <div className="fm-info-box">
            <table>
              <tbody>
                <tr>
                  <td>归档周期</td>
                  <td>{artifact.periodLabel}</td>
                </tr>
                <tr>
                  <td>结果类型</td>
                  <td>{artifact.badgeLabel}</td>
                </tr>
                <tr>
                  <td>签发单位</td>
                  <td>{artifact.issuer}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="fm-signature">
            <div>Freshmanto Records</div>
            <div className="mt-2">{artifact.sealLabel}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
