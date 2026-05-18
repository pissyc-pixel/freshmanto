import Link from "next/link";

import { ActiveRunSync } from "@/components/active-run-sync";
import { FmEmptyState } from "@/components/fm-ui/FmEmptyState";
import { FmAppRoot, FmBrandMark, FmIcon } from "@/components/fm-ui/FmScaffold";
import { ProfileSummary } from "@/components/profile-summary";
import { buildAdmissionViewModel } from "@/lib/admission-view-model";
import { resolveActiveRunId } from "@/lib/demo/active-run";
import { readActiveRunIdFromCookies } from "@/lib/demo/server-run-context";
import { getServerDemoRun } from "@/lib/demo/server";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";

export const dynamic = "force-dynamic";

type AdmissionPageProps = {
  searchParams: DemoPageSearchParams;
};

export default async function AdmissionPage({ searchParams }: AdmissionPageProps) {
  const params = await searchParams;
  const runId = resolveActiveRunId({
    searchParamRunId: readSearchParam(params.runId),
    cookieRunId: await readActiveRunIdFromCookies(),
  });
  const run = runId ? await getServerDemoRun(runId) : null;

  if (!runId || !run) {
    return (
      <FmAppRoot>
        <div className="fm-page-center">
          <div className="fm-page-grid">
            <aside className="fm-side-sheet">
              <FmBrandMark />
              <div className="mt-6">
                <p className="fm-muted-note">
                  这里会展示这一局已经生成好的入学档案。没有存档时，不会凭空补出一份录取通知。
                </p>
              </div>
            </aside>

            <section className="fm-document-card">
              <FmEmptyState
                title="还没有可确认的录取信息"
                body="先回到首页创建一局真实存档。录取通知书页不会自己生成学校、姓名、专业和校区。"
              />
              <div className="fm-doc-actions">
                <Link href="/" className="fm-doc-button fm-doc-button--primary">
                  返回首页
                </Link>
              </div>
            </section>
          </div>
        </div>
      </FmAppRoot>
    );
  }

  const viewModel = buildAdmissionViewModel(run);

  return (
    <FmAppRoot data-testid="admission-page">
      <ActiveRunSync runId={run.id} />
      <div className="fm-page-center">
        <div className="fm-page-grid">
          <aside className="fm-side-sheet">
            <FmBrandMark />
            <p className="mt-4 fm-muted-note">
              你的大学生活档案已建立。确认入学后，会从第一周开始安排课程态度和每日行动。
            </p>

            <div className="mt-6 fm-stack">
              <div className="fm-stat-card">
                <div className="fm-stat-card__label">学校层级</div>
                <div className="fm-stat-card__value">{viewModel.schoolTierLabel}</div>
              </div>
              <div className="fm-stat-card">
                <div className="fm-stat-card__label">城市层级</div>
                <div className="fm-stat-card__value">{viewModel.cityTierLabel}</div>
              </div>
              <div className="fm-stat-card">
                <div className="fm-stat-card__label">学科方向</div>
                <div className="fm-stat-card__value">{viewModel.trackLabel}</div>
              </div>
            </div>
          </aside>

          <section className="fm-document-card">
            <div className="fm-admission-header">
              <div>
                <div className="fm-admission-brand-cn">Freshmanto 录取办</div>
                <div className="fm-admission-brand-en">FRESHMANTO ADMISSION OFFICE</div>
              </div>
              <div className="fm-admission-seal">已建档</div>
            </div>

            <div className="fm-admission-rule" />
            <h1 className="fm-admission-title">录取通知书</h1>
            <div className="fm-admission-number">编号：{viewModel.documentNumber}</div>

            <div className="fm-letter">
              <p>
                <strong>{viewModel.studentName}</strong> 同学：
              </p>
              <p>{viewModel.statement}</p>
              <p>
                接下来，你将从第一周开始安排课程态度、每日行动，并在周末查看本周结果。以下信息会影响你的大学资源、
                生活成本、机会密度与行动选择。
              </p>
            </div>

            <div className="mt-8">
              <ProfileSummary profile={run.profile} />
            </div>

            <div className="fm-doc-actions">
              <Link
                href={`/game?runId=${runId}`}
                className="fm-doc-button fm-doc-button--primary"
                data-testid="admission-confirm"
              >
                <FmIcon name="check" />
                <span>确认入学</span>
              </Link>
              <button type="button" className="fm-doc-button" data-testid="admission-share">
                <FmIcon name="file" />
                <span>分享</span>
              </button>
              <div className="fm-official">
                <FmIcon name="file" className="h-4 w-4" />
                <span>新生档案</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </FmAppRoot>
  );
}
