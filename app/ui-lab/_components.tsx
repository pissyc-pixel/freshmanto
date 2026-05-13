import Link from "next/link";
import { ReactNode } from "react";
import { plannerDays, profile, sidebarLinks } from "@/app/ui-lab/mock-data";

type IconName =
  | "alert"
  | "book"
  | "book-open"
  | "bookmark"
  | "briefcase"
  | "calendar"
  | "cap"
  | "chart"
  | "check"
  | "close"
  | "file"
  | "heart-hand"
  | "map-pin"
  | "medal"
  | "menu"
  | "moon"
  | "run"
  | "settings"
  | "sheet"
  | "share"
  | "smile"
  | "spark"
  | "team"
  | "trophy"
  | "users"
  | "wallet";

export function Icon({
  name,
  className,
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

  const sizeClass = className ?? "h-5 w-5";

  switch (name) {
    case "calendar":
      return (
        <svg className={sizeClass} {...common}>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      );
    case "file":
    case "sheet":
      return (
        <svg className={sizeClass} {...common}>
          <path d="M8 3h7l5 5v13H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" />
          <path d="M15 3v6h6" />
        </svg>
      );
    case "book":
      return (
        <svg className={sizeClass} {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5A2.5 2.5 0 0 0 17.5 16H4z" />
          <path d="M20 18.5A2.5 2.5 0 0 0 17.5 16H4" />
          <path d="M12 5v11" />
        </svg>
      );
    case "book-open":
      return (
        <svg className={sizeClass} {...common}>
          <path d="M12 7c-1.5-1.6-4-2.5-7-2.5v13c3 0 5.5.9 7 2.5 1.5-1.6 4-2.5 7-2.5v-13c-3 0-5.5.9-7 2.5Z" />
        </svg>
      );
    case "wallet":
      return (
        <svg className={sizeClass} {...common}>
          <path d="M4 7h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
          <path d="M4 8V6a2 2 0 0 1 2-2h11" />
          <circle cx="16" cy="13" r="1" />
        </svg>
      );
    case "smile":
      return (
        <svg className={sizeClass} {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 9.5h.01M15.5 9.5h.01M8 14c1 1.5 2.5 2.2 4 2.2 1.6 0 3-.7 4-2.2" />
        </svg>
      );
    case "alert":
      return (
        <svg className={sizeClass} {...common}>
          <path d="M12 4 3.8 18.2A1.3 1.3 0 0 0 5 20h14a1.3 1.3 0 0 0 1.2-1.8Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      );
    case "menu":
      return (
        <svg className={sizeClass} {...common}>
          <path d="M4 7h10M4 12h8M4 17h12" />
          <path d="m15 18 4-4m0 0h-3m3 0v3" />
        </svg>
      );
    case "share":
      return (
        <svg className={sizeClass} {...common}>
          <path d="M12 16V6" />
          <path d="m8 10 4-4 4 4" />
          <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
        </svg>
      );
    case "check":
      return (
        <svg className={sizeClass} {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12.3 2.3 2.4 4.8-5" />
        </svg>
      );
    case "close":
      return (
        <svg className={sizeClass} {...common}>
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      );
    case "moon":
      return (
        <svg className={sizeClass} {...common}>
          <path d="M20 13.2A8 8 0 1 1 10.8 4 6.2 6.2 0 0 0 20 13.2Z" />
        </svg>
      );
    case "briefcase":
      return (
        <svg className={sizeClass} {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2.5" />
          <path d="M8 7V5.8A1.8 1.8 0 0 1 9.8 4h4.4A1.8 1.8 0 0 1 16 5.8V7M3 12h18" />
        </svg>
      );
    case "users":
    case "team":
      return (
        <svg className={sizeClass} {...common}>
          <circle cx="8" cy="10" r="2.5" />
          <circle cx="16" cy="9" r="2.3" />
          <path d="M4.5 18a4.2 4.2 0 0 1 7 0M12.7 18a3.9 3.9 0 0 1 6.3-2.3" />
        </svg>
      );
    case "run":
      return (
        <svg className={sizeClass} {...common}>
          <circle cx="15" cy="5.5" r="1.6" />
          <path d="m12 9 2.7-1.2 1.8 2.2 2.5 1.1M8 20l2.2-4.8 3.6-.4 1.4-3.5M4 14h4l2-3.5" />
        </svg>
      );
    case "map-pin":
      return (
        <svg className={sizeClass} {...common}>
          <path d="M12 21s6-4.6 6-10a6 6 0 1 0-12 0c0 5.4 6 10 6 10Z" />
          <circle cx="12" cy="11" r="2" />
        </svg>
      );
    case "spark":
      return (
        <svg className={sizeClass} {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
        </svg>
      );
    case "bookmark":
      return (
        <svg className={sizeClass} {...common}>
          <path d="M7 4h10v16l-5-3-5 3Z" />
        </svg>
      );
    case "cap":
      return (
        <svg className={sizeClass} {...common}>
          <path d="m3 10 9-5 9 5-9 5-9-5Z" />
          <path d="M7 12.3v4.2c3 2 7 2 10 0v-4.2" />
        </svg>
      );
    case "chart":
      return (
        <svg className={sizeClass} {...common}>
          <path d="M4 20V4M4 20h16" />
          <path d="M8 16v-4M12 16V8M16 16v-7" />
        </svg>
      );
    case "trophy":
      return (
        <svg className={sizeClass} {...common}>
          <path d="M7 4h10v4a5 5 0 0 1-10 0Z" />
          <path d="M9 18h6M12 13v5M6 5H4a2 2 0 0 0 2 4M18 5h2a2 2 0 0 1-2 4" />
        </svg>
      );
    case "medal":
      return (
        <svg className={sizeClass} {...common}>
          <path d="m8 4 4 5 4-5" />
          <circle cx="12" cy="15" r="4.5" />
          <path d="m10.2 15 1.2 1.4 2.4-2.7" />
        </svg>
      );
    case "heart-hand":
      return (
        <svg className={sizeClass} {...common}>
          <path d="M12 10.5s-3-1.8-3-4.1a2.4 2.4 0 0 1 4-1.8 2.4 2.4 0 0 1 4 1.8c0 2.3-3 4.1-3 4.1Z" />
          <path d="M4 18h5l1.5-1.4a2 2 0 0 1 1.4-.6H14a1.7 1.7 0 0 0 1.7-1.7V14" />
          <path d="M14 14h3.4a2.6 2.6 0 0 1 0 5.2H13" />
        </svg>
      );
    case "settings":
      return (
        <svg className={sizeClass} {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="m19 12 2-1-2-1-.4-1.2 1.2-2-2-2-2 1.2L14 4l-1-2-1 2-1.6.6L8.4 3.4l-2 2 1.2 2L7 10l-2 1 2 1 .4 1.8-1.2 2 2 2 2-1.2 1.6.6 1 2 1-2 1.6-.6 2 1.2 2-2-1.2-2z" />
        </svg>
      );
    default:
      return (
        <svg className={sizeClass} {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

export function UiLabRoot({
  children,
  mode = "full",
}: {
  children: ReactNode;
  mode?: "full" | "centered";
}) {
  return (
    <main className={`fm-lab-root ${mode === "centered" ? "fm-lab-root--centered" : ""}`}>
      {children}
    </main>
  );
}

export function BrandWordmark({
  size = "default",
}: {
  size?: "default" | "hero";
}) {
  return (
    <div className={`fm-wordmark ${size === "hero" ? "fm-wordmark--hero" : ""}`}>
      {size === "hero" ? "FRESHMANTO" : "Freshmanto"}
    </div>
  );
}

export function AvatarCard() {
  return (
    <section className="fm-profile-card">
      <div className="fm-avatar">
        <div className="fm-avatar__hair" />
        <div className="fm-avatar__face" />
        <div className="fm-avatar__body" />
      </div>
      <div>
        <div className="fm-profile-card__name">{profile.name}</div>
        <div className="fm-profile-card__sub">{profile.subtitle}</div>
      </div>
    </section>
  );
}

export function Sidebar({
  active,
}: {
  active: "planner" | "resume" | "journal";
}) {
  return (
    <aside className="fm-sidebar">
      <div>
        <BrandWordmark />
        <p className="fm-sidebar__sub">大学生活模拟器 v2.0</p>
      </div>
      <AvatarCard />
      <nav className="fm-sidebar__nav">
        {sidebarLinks.map((link) => (
          <Link
            href={link.href.replace("/app", "")}
            key={link.key}
            className={`fm-nav-link ${active === link.key ? "is-active" : ""}`}
          >
            <Icon name={link.icon} />
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="fm-sidebar__footer">
        <button type="button" className="fm-cta-pill">
          <Icon name="spark" />
          <span>开始新的一天</span>
        </button>
        <button type="button" className="fm-side-action">
          <Icon name="settings" />
          <span>系统设置</span>
        </button>
        <button type="button" className="fm-side-action">
          <Icon name="share" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}

export function LabShell({
  active,
  header,
  subheader,
  topRight,
  children,
}: {
  active: "planner" | "resume" | "journal";
  header: ReactNode;
  subheader?: ReactNode;
  topRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <UiLabRoot>
      <div className="fm-shell">
        <Sidebar active={active} />
        <section className="fm-shell__main">
          <header className="fm-shell__header">
            <div>
              <div className="fm-shell__title">{header}</div>
              {subheader ? <div className="fm-shell__subtitle">{subheader}</div> : null}
            </div>
            {topRight ? <div>{topRight}</div> : null}
          </header>
          {children}
        </section>
      </div>
    </UiLabRoot>
  );
}

export function MetricStrip({
  items,
}: {
  items: ReadonlyArray<{
    label: string;
    value: string;
    color: string;
    icon: IconName;
    progress: number;
  }>;
}) {
  return (
    <section className="fm-card fm-metric-strip">
      {items.map((item) => (
        <div className="fm-metric" key={item.label}>
          <div className={`fm-metric__icon tone-${item.color}`}>
            <Icon name={item.icon} />
          </div>
          <div className="fm-metric__label">{item.label}</div>
          <div className="fm-metric__value">{item.value}</div>
          <div className="fm-meter">
            <span className={`tone-${item.color}`} style={{ width: `${item.progress * 100}%` }} />
          </div>
        </div>
      ))}
    </section>
  );
}

export function WeekCard({
  title,
  caption,
  current,
}: {
  title: string;
  caption: string;
  current?: boolean;
}) {
  const leftDays = plannerDays.slice(0, 4);
  const rightDays = plannerDays.slice(4);

  return (
    <section className={`fm-card fm-week-card ${current ? "is-current" : ""}`}>
      <div className="fm-week-card__header">
        <div>
          <h3>{title}</h3>
          <p>{caption}</p>
        </div>
        {current ? <span className="fm-week-badge">当前周</span> : null}
      </div>
      <div className="fm-week-card__grid">
        <div className="fm-day-stack">
          {leftDays.map((day) => (
            <DayChip key={day.day} {...day} />
          ))}
        </div>
        <div className="fm-day-stack">
          {rightDays.map((day) => (
            <DayChip key={day.day} {...day} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DayChip({
  day,
  tag,
  tagTone,
  text,
}: {
  day: string;
  tag: string;
  tagTone: string;
  text: string;
}) {
  return (
    <div className="fm-day-chip">
      <div className="fm-day-chip__row">
        <strong>{day}</strong>
        <span className={`fm-pill tone-${tagTone}`}>{tag}</span>
      </div>
      <p>{text}</p>
    </div>
  );
}

export function FloatingActionButton({ icon = "menu" as IconName }) {
  return (
    <button type="button" className="fm-fab">
      <Icon name={icon} />
    </button>
  );
}

export function InlineStat({
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
    <div className={`fm-inline-stat tone-${tone}`}>
      <div className="fm-inline-stat__icon">
        <Icon name={icon} />
      </div>
      <div>
        <div className="fm-inline-stat__label">{label}</div>
        <div className="fm-inline-stat__value">{value}</div>
      </div>
    </div>
  );
}
