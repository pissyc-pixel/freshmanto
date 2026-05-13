import Link from "next/link";

import { FmEmptyState } from "@/components/fm-ui/FmEmptyState";
import { FmPartialNotice } from "@/components/fm-ui/FmPartialNotice";
import { FmAppRoot, FmBrandMark, FmIcon } from "@/components/fm-ui/FmScaffold";
import { buildAdmissionViewModel } from "@/lib/admission-view-model";
import { getServerDemoBundle } from "@/lib/demo/server";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";

export const dynamic = "force-dynamic";

type AdmissionPageProps = {
  searchParams: DemoPageSearchParams;
};

export default async function AdmissionPage({ searchParams }: AdmissionPageProps) {
  const params = await searchParams;
  const runId = readSearchParam(params.runId);
  const bundle = runId ? await getServerDemoBundle(runId) : null;

  if (!runId || !bundle) {
    return (
      <FmAppRoot>
        <div className="fm-page-center">
          <div className="fm-page-grid">
            <aside className="fm-side-sheet">
              <FmBrandMark />
              <div className="mt-6">
                <FmPartialNotice
                  title="开局确认页"
                  body="这一步只展示当前 run 已有的真实字段。没有 run 的时候，不会伪造录取信息。"
                />
              </div>
            </aside>

            <section className="fm-document-card">
              <FmEmptyState
                title="还没有可确认的录取信息"
                body="先回到首页创建一局真实 run。录取通知书页不会自己生成学校、姓名、专业和校区。"
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

  const viewModel = buildAdmissionViewModel(bundle.run);

  return (
    <FmAppRoot data-testid="admission-page">
      <div className="fm-page-center">
        <div className="fm-page-grid">
          <aside className="fm-side-sheet">
            <FmBrandMark />
            <p className="mt-4 fm-muted-note">这一页只承接开局仪式，不改任何规则结果，也不额外生成角色事实。</p>

            <div className="mt-6">
              <FmPartialNotice
                title="当前为 partial 接入"
                body="真实流程里目前只有学校层级、城市层级和学科方向等基础画像；姓名、院系、专业、校区等字段暂未记录。"
              />
            </div>

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
                你已被纳入本局大学生活模拟流程，后续每周行动、月末结算、成长日志、月记与履历都将只基于该
                `run` 的真实推进结果呈现。
              </p>
              <p>
                尚未被规则层确认的字段将暂以保守文案保留，不会以 UI 需要为理由补写成完整学校、专业或校区。
              </p>
            </div>

            <div className="fm-admission-footer">
              <div className="fm-info-box">
                <table>
                  <tbody>
                    <tr>
                      <td>录取单位</td>
                      <td>{viewModel.schoolName}</td>
                    </tr>
                    <tr>
                      <td>院系</td>
                      <td>{viewModel.departmentName}</td>
                    </tr>
                    <tr>
                      <td>专业</td>
                      <td>{viewModel.majorName}</td>
                    </tr>
                    <tr>
                      <td>校区</td>
                      <td>{viewModel.campusName}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="fm-signature">
                <p>Freshmanto 模拟教务中心</p>
                <p className="mt-16">大学生活流程已确认</p>
              </div>
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
              <button type="button" className="fm-doc-button fm-doc-button--disabled" disabled aria-disabled="true">
                <FmIcon name="file" />
                <span>分享功能后续开放</span>
              </button>
              <div className="fm-official">
                <FmIcon name="file" className="h-4 w-4" />
                <span>official document</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </FmAppRoot>
  );
}
