import type { ChangeEvent } from "react";

type LocalizedFileInputProps = {
  accept: string;
  ariaLabel: string;
  chooseFileLabel: string;
  id: string;
  name: string;
  noFileSelectedLabel: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  selectedFileName?: string;
};

export function LocalizedFileInput({
  accept,
  ariaLabel,
  chooseFileLabel,
  id,
  name,
  noFileSelectedLabel,
  onChange,
  selectedFileName,
}: LocalizedFileInputProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <input
        accept={accept}
        aria-label={ariaLabel}
        className="peer sr-only"
        id={id}
        name={name}
        onChange={onChange}
        type="file"
      />
      <label
        className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-frosted-blue-200 bg-white px-4 text-sm font-semibold text-deep-twilight-800 shadow-sm transition-colors hover:bg-frosted-blue-50 peer-focus-visible:ring-2 peer-focus-visible:ring-bright-teal-blue-100 peer-focus-visible:ring-offset-2 sm:w-auto"
        htmlFor={id}
      >
        {chooseFileLabel}
      </label>
      <span className="min-w-0 truncate rounded-md border border-frosted-blue-200 bg-white px-3 py-2 text-sm text-deep-twilight-700 shadow-sm sm:flex-1">
        {selectedFileName ?? noFileSelectedLabel}
      </span>
    </div>
  );
}
