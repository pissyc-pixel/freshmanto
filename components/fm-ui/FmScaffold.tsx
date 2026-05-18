import Link from "next/link";
import { ComponentPropsWithoutRef, ReactNode } from "react";

import { FmCard } from "@/components/fm-ui/FmCard";
import { buildRunHref } from "@/lib/demo/active-run";
import { featureReadiness, isFeatureRoutedForPlayers, type FeatureKey } from "@/lib/feature-readiness";

type IconName =
  | "alert"
  | "book"
  | "briefcase"
  | "calendar"
  | "chart"
  | "check"
  | "chevron-right"
  | "compass"
  | "file"
  | "home"
  | "minus"
  | "moon"
  | "spark"
  | "trend-down"
  | "trend-up"
  | "trophy"
  | "users";

type SidebarPageKey = "game" | "journal" | "resume" | "ending";

type SidebarLink = {
  key: string;
  label: string;
  href?: string;
  icon: IconName;
  readiness: FeatureKey;
  sidebarKey?: SidebarPageKey;
};

const sidebarLinks: SidebarLink[] = [
  {
    key: "game",
    label: "本周周历",
    href: "/game",
    icon: "calendar",
    readiness: "weeklyPlanner",
    sidebarKey: "game",
  },
  {
    key: "journal",
    label: "成长日志",
    href: "/journal",
    icon: "book",
    readiness: "journal",
    sidebarKey: "journal",
  },
  {
    key: "resume",
    label: "履历档案",
    href: "/resume",
    icon: "file",
    readiness: "resume",
    sidebarKey: "resume",
  },
  {
    key: "ending",
    label: "结局预览",
    href: "/ending",
    icon: "chart",
    readiness: "endingPreview",
    sidebarKey: "ending",
  },
  {
    key: "campusMap",
    label: "Campus Map",
    icon: "compass",
    readiness: "campusMap",
  },
  {
    key: "socialCircle",
    label: "Social Circle",
    icon: "users",
    readiness: "socialCircle",
  },
];

export function FmIcon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.9,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "home":
      return (
        <svg className={className} {...common}>
          <path d="m4 11 8-6 8 6" />
          <path d="M6 10.8V20h12v-9.2" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={className} {...common}>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      );
    case "alert":
      return (
        <svg className={className} {...common}>
          <path d="M12 4 3.8 18.2A1.3 1.3 0 0 0 5 20h14a1.3 1.3 0 0 0 1.2-1.8Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      );
    case "book":
      return (
        <svg className={className} {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5A2.5 2.5 0 0 0 17.5 16H4z" />
          <path d="M20 18.5A2.5 2.5 0 0 0 17.5 16H4" />
          <path d="M12 5v11" />
        </svg>
      );
    case "file":
      return (
        <svg className={className} {...common}>
          <path d="M8 3h7l5 5v13H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" />
          <path d="M15 3v6h6" />
        </svg>
      );
    case "chart":
      return (
        <svg className={className} {...common}>
          <path d="M4 20V4M4 20h16" />
          <path d="M8 16v-4M12 16V8M16 16v-7" />
        </svg>
      );
    case "briefcase":
      return (
        <svg className={className} {...common}>
          <rect x="3" y="7" width="18" height="13" rx="3" />
          <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" />
          <path d="M3 12h18" />
        </svg>
      );
    case "compass":
      return (
        <svg className={className} {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m14.8 9.2-2 5.6-5.6 2 2-5.6z" />
        </svg>
      );
    case "users":
      return (
        <svg className={className} {...common}>
          <circle cx="8" cy="10" r="2.5" />
          <circle cx="16" cy="9" r="2.3" />
          <path d="M4.5 18a4.2 4.2 0 0 1 7 0M12.7 18a3.9 3.9 0 0 1 6.3-2.3" />
        </svg>
      );
    case "spark":
      return (
        <svg className={className} {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
        </svg>
      );
    case "moon":
      return (
        <svg className={className} {...common}>
          <path d="M20 13.2A8 8 0 1 1 10.8 4 6.2 6.2 0 0 0 20 13.2Z" />
        </svg>
      );
    case "trend-up":
      return (
        <svg className={className} {...common}>
          <path d="M4 16 10 10l4 4 6-7" />
          <path d="M16 7h4v4" />
        </svg>
      );
    case "trend-down":
      return (
        <svg className={className} {...common}>
          <path d="m4 8 6 6 4-4 6 7" />
          <path d="M16 17h4v-4" />
        </svg>
      );
    case "minus":
      return (
        <svg className={className} {...common}>
          <path d="M5 12h14" />
        </svg>
      );
    case "trophy":
      return (
        <svg className={className} {...common}>
          <path d="M8 4h8v3a4 4 0 0 1-8 0Z" />
          <path d="M9 17h6M10 20h4M7 7H5a2 2 0 0 0 2 3M17 7h2a2 2 0 0 1-2 3" />
        </svg>
      );
    case "check":
      return (
        <svg className={className} {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12.3 2.3 2.4 4.8-5" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg className={className} {...common}>
          <path d="m10 7 5 5-5 5" />
        </svg>
      );
    default:
      return null;
  }
}

export function FmAppRoot({
  children,
  centered = false,
  ...props
}: {
  children: ReactNode;
  centered?: boolean;
} & ComponentPropsWithoutRef<"main">) {
  return (
    <main className={`fm-app-root ${centered ? "fm-app-root--centered" : ""}`} {...props}>
      {children}
    </main>
  );
}

export function FmBrandMark({
  hero = false,
}: {
  hero?: boolean;
}) {
  return <div className={`fm-brand-mark ${hero ? "fm-brand-mark--hero" : ""}`}>Freshmanto</div>;
}

export function FmPanel({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <FmCard variant="normal" padded={padded} className={`fm-panel ${className}`.trim()}>
      {children}
    </FmCard>
  );
}

export function FmInlineStat({
  tone,
  icon,
  label,
  value,
}: {
  tone: string;
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <div className="fm-inline-stat">
      <div className={`fm-inline-stat__icon tone-${tone}`}>
        <FmIcon name={icon} />
      </div>
      <div>
        <div className="fm-inline-stat__label">{label}</div>
        <div className="fm-inline-stat__value">{value}</div>
      </div>
    </div>
  );
}

export function FmMetricStrip({
  items,
}: {
  items: ReadonlyArray<{
    label: string;
    value: string;
    tone: string;
    icon: IconName;
    progress: number;
    warning?: string;
    state?: "normal" | "warning" | "danger";
  }>;
}) {
  return (
    <section className="fm-card fm-card--normal fm-card--pad fm-metric-strip">
      {items.map((item) => (
        <article key={item.label} className={`fm-status-card fm-status-card--${item.state ?? "normal"}`}>
          <div className={`fm-inline-stat__icon tone-${item.tone}`}>
            <FmIcon name={item.icon} />
          </div>
          <div className="fm-status-card__label">{item.label}</div>
          <div className="fm-status-card__value">{item.value}</div>
          <div className="fm-meter">
            <span className={`tone-${item.tone}`} style={{ width: `${Math.max(0, Math.min(item.progress, 1)) * 100}%` }} />
          </div>
          {item.warning ? (
            <div className="fm-status-card__warning">
              {item.warning}
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}

export function FmShellLayout({
  active,
  runId,
  title,
  subtitle,
  sidebarTitle = "大学生活模拟器",
  sidebarSubtitle = "这里整理的是当前存档已经形成的内容。",
  sidebarSummary,
  headerMeta,
  children,
}: {
  active: SidebarPageKey;
  runId?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  sidebarTitle?: string;
  sidebarSubtitle?: string;
  sidebarSummary?: string;
  headerMeta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <FmAppRoot>
      <div className="fm-shell-layout">
        <aside className="fm-sidebar">
          <div>
            <FmBrandMark />
            <p className="fm-sidebar__sub">{sidebarSubtitle}</p>
          </div>

          <section className="fm-profile-card">
            <div className="fm-profile-card__title">{sidebarTitle}</div>
            <p className="fm-profile-card__sub">
              {sidebarSummary ?? "从新生建档、周安排到月末汇总，都会按这局存档的实际推进逐步展开。"}
            </p>
          </section>

          <nav className="fm-sidebar__nav" data-testid="formal-sidebar-nav">
            <Link href="/" aria-hidden={Boolean(runId)} className={`fm-nav-link ${runId ? "hidden" : ""}`.trim()}>
              <FmIcon name="home" />
              <span>{runId ? "" : "开局页"}</span>
            </Link>

            {sidebarLinks.map((link) => {
              const readiness = featureReadiness[link.readiness];
              if (!link.href || !isFeatureRoutedForPlayers(link.readiness)) {
                return null;
              }

                return (
                  <Link
                  href={buildRunHref(link.href, runId)}
                    key={link.key}
                    data-testid={`formal-nav-${link.key}`}
                    className={`fm-nav-link ${active === link.sidebarKey ? "is-active" : ""}`}
                >
                  <FmIcon name={link.icon} />
                  <span>{link.label}</span>
                  {readiness.status === "partial" ? <span className="fm-nav-link__meta">进行中</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className="fm-sidebar__footer">
            <Link href="/" className="fm-button-secondary">
              <FmIcon name="spark" />
              <span>开始新的大学回合</span>
            </Link>
          </div>
        </aside>

        <section className="fm-shell-main">
          <header className="fm-shell-header">
            <div>
              <div className="fm-shell-title">{title}</div>
              {subtitle ? <div className="fm-shell-subtitle">{subtitle}</div> : null}
            </div>
            {headerMeta ? <div className="fm-shell-meta">{headerMeta}</div> : null}
          </header>
          {children}
        </section>
      </div>
    </FmAppRoot>
  );
}

export function FmSectionHead({
  title,
  copy,
  aside,
}: {
  title: string;
  copy?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="fm-section-head">
      <div>
        <h2 className="fm-section-title">{title}</h2>
        {copy ? <p className="fm-section-copy">{copy}</p> : null}
      </div>
      {aside}
    </div>
  );
}
