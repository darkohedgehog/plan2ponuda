import Link from "next/link";

const footerLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <Link className="text-base font-semibold text-slate-950" href="/">
            Plan2Ponuda
          </Link>
          <p className="mt-2 text-sm text-slate-500">
            Faster electrical installation estimates from floor plans.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex gap-5">
          {footerLinks.map((link) => (
            <Link
              className="rounded-md text-sm font-medium text-slate-500 outline-none transition-colors hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-100"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
