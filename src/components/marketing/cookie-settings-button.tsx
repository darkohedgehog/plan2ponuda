"use client";

type CookieSettingsButtonProps = {
  children: string;
  className: string;
};

export const OPEN_COOKIE_PREFERENCES_EVENT = "ploro:open-cookie-preferences";

export function CookieSettingsButton({
  children,
  className,
}: CookieSettingsButtonProps) {
  return (
    <button
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT))}
      type="button"
    >
      {children}
    </button>
  );
}
