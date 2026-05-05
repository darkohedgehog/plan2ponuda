"use client";

import { useTranslations } from "next-intl";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  useState,
} from "react";

import { formControlClassName } from "@/components/ui/form-control";

type PasswordInputProps = {
  autoComplete: string;
  minLength?: number;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  value: string;
};

type PasswordStrength = "weak" | "medium" | "strong";

const strengthBarStyles: Record<PasswordStrength, string> = {
  medium: "bg-amber-500",
  strong: "bg-emerald-600",
  weak: "bg-red-500",
};

const strengthTextStyles: Record<PasswordStrength, string> = {
  medium: "text-amber-700",
  strong: "text-emerald-700",
  weak: "text-red-700",
};

export function PasswordInput({
  autoComplete,
  minLength,
  name,
  onChange,
  placeholder,
  required = false,
  value,
}: PasswordInputProps) {
  const tAuth = useTranslations("Auth");
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  function updateCapsLockState(event: KeyboardEvent<HTMLInputElement>) {
    setIsCapsLockOn(event.getModifierState("CapsLock"));
  }

  return (
    <div className="grid gap-2">
      <div className="relative">
        <input
          autoComplete={autoComplete}
          className={`${formControlClassName} w-full pr-11`}
          minLength={minLength}
          name={name}
          onBlur={() => setIsCapsLockOn(false)}
          onChange={onChange}
          onKeyDown={updateCapsLockState}
          onKeyUp={updateCapsLockState}
          placeholder={placeholder}
          required={required}
          type={showPassword ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={
            showPassword ? tAuth("hidePassword") : tAuth("showPassword")
          }
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 outline-none transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-blue-100"
          onClick={() => setShowPassword((currentValue) => !currentValue)}
          type="button"
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {isCapsLockOn ? (
        <p className="text-xs font-medium text-amber-700">
          {tAuth("capsLockOn")}
        </p>
      ) : null}
    </div>
  );
}

type PasswordStrengthIndicatorProps = {
  password: string;
};

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const tPasswordStrength = useTranslations("Auth.passwordStrength");

  if (password.length === 0) {
    return null;
  }

  const strength = getPasswordStrength(password);
  const barWidth: Record<PasswordStrength, string> = {
    medium: "w-2/3",
    strong: "w-full",
    weak: "w-1/3",
  };

  return (
    <div className="grid gap-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barWidth[strength]} ${strengthBarStyles[strength]}`}
        />
      </div>
      <p className={`text-xs font-medium ${strengthTextStyles[strength]}`}>
        {tPasswordStrength("label", {
          strength: tPasswordStrength(strength),
        })}
      </p>
    </div>
  );
}

function getPasswordStrength(password: string): PasswordStrength {
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (password.length >= 10 && hasLetter && hasNumber && hasSymbol) {
    return "strong";
  }

  if (password.length >= 8 && hasLetter && hasNumber) {
    return "medium";
  }

  return "weak";
}

function EyeIcon() {
  return (
    <IconSvg>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </IconSvg>
  );
}

function EyeOffIcon() {
  return (
    <IconSvg>
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.8 17.8 0 0 1-2.1 3.1" />
      <path d="M6.6 6.6C3.7 8.6 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 4.2-.8" />
    </IconSvg>
  );
}

type IconSvgProps = {
  children: ReactNode;
};

function IconSvg({ children }: IconSvgProps) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}
