import Link from "next/link";
import { ReactNode } from "react";

import { featureReadiness, type FeatureKey } from "@/lib/feature-readiness";

type IconName =
  | "alert"
  | "book"
  | "calendar"
  | "chart"
  | "check"
  | "chevron-right"
  | "compass"
  | "file"
  | "home"
  | "moon"
  | "spark"
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
    label: "个人履历",
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
}: {
  children: ReactNode;
  centered?: boolean;
}) {
  return <main className={`fm-app-root ${centered ? "fm-app-root--centered" : ""}`}>{children}</main>;
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
  return <section className={`fm-panel ${padded ? "fm-panel--pad" : ""} ${className}`.trim()}>{children}</section>;
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
  }>;
}) {
  return (
    <section className="fm-panel fm-metric-strip">
      {items.map((item) => (
        <div key={item.label}>
          <div className={`fm-inline-stat__icon tone-${item.tone}`}>
            <FmIcon name={item.icon} />
          </div>
          <div className="fm-stat-card__label">{item.label}</div>
          <div className="fm-stat-card__value">{item.value}</div>
          <div className="fm-meter">
            <span className={`tone-${item.tone}`} style={{ width: `${Math.max(0, Math.min(item.progress, 1)) * 100}%` }} />
          </div>
        </div>
      ))}
    </section>
  );
}

export function FmShellLayout({
  active,
  title,
  subtitle,
  sidebarTitle = "大学生活模拟器",
  sidebarSubtitle = "真实流程只展示规则层已经产出的内容",
  sidebarSummary,
  headerMeta,
  children,
}: {
  active: SidebarPageKey;
  title: ReactNode;
  subtitle?: ReactNode;
  sidebarTitle?: string;
  sidebarSubtitle?: string;
  sidebarSummary?: string;
  headerMeta?: ReactNode;
  children: ReactNode;
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
              {sidebarSummary ?? "未形成的系统不会伪装成已经完成，只保留真实可用入口。"}
            </p>
          </section>

          <nav className="fm-sidebar__nav">
            <Link href="/" className={`fm-nav-link ${active === "game" ? "" : ""}`.trim()}>
              <FmIcon name="home" />
              <span>开局页</span>
            </Link>

            {sidebarLinks.map((link) => {
              const readiness = featureReadiness[link.readiness];
              if (readiness.status === "not_ready" && !link.href) {
                return (
                  <div key={link.key} className="fm-nav-link--disabled">
                    <FmIcon name={link.icon} />
                    <span>{link.label}</span>
                    <span className="fm-nav-link__meta">后续开放</span>
                  </div>
                );
              }

              if (!link.href) {
                return null;
              }

              return (
                <Link
                  href={link.href}
                  key={link.key}
                  className={`fm-nav-link ${active === link.sidebarKey ? "is-active" : ""}`}
                >
                  <FmIcon name={link.icon} />
                  <span>{link.label}</span>
                  {readiness.status === "partial" ? <span className="fm-nav-link__meta">partial</span> : null}
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
