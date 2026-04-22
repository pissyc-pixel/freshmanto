import Link from "next/link";

const items = [
  { href: "/", label: "开局页" },
  { href: "/game", label: "主游戏页" },
  { href: "/settlement", label: "月结算" },
  { href: "/journal", label: "月记" },
  { href: "/resume", label: "履历" },
  { href: "/ending", label: "结局" }
];

export function NavBar() {
  return (
    <nav className="flex flex-wrap gap-3 rounded-full border border-amber-900/10 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-full px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-amber-100 hover:text-stone-950"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

