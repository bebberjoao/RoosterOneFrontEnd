import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PopoverSelect } from "./dropdown";

export function Field({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const controlClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(controlClass, "min-h-24 resize-y", props.className)} />;
}

export function SelectInput({
  options,
  value,
  onChange,
  placeholder,
  className,
  id,
  disabled,
}: {
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <PopoverSelect
      value={value ?? ""}
      onChange={(v) => onChange?.({ target: { value: v } })}
      options={options}
      placeholder={placeholder}
      className={className}
      id={id}
      disabled={disabled}
    />
  );
}

/** Mock file/photo upload — stores a local object URL, ready to be swapped for a real upload endpoint. */
export function FileUpload({
  value,
  onChange,
  accept = "image/*",
  label = "Selecionar arquivo",
  preview = true,
}: {
  value?: string;
  onChange: (url: string | undefined, file?: File) => void;
  accept?: string;
  label?: string;
  preview?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string>();

  return (
    <div className="flex items-center gap-3">
      {preview && value ? (
        <img src={value} alt="" className="h-14 w-14 rounded-lg border object-cover" />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
          <ImagePlus className="h-4 w-4" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          <Upload className="h-3.5 w-3.5" />
          {label}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange(undefined);
              setName(undefined);
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        {name ? <span className="max-w-[160px] truncate text-xs text-muted-foreground">{name}</span> : null}
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setName(file.name);
          onChange(URL.createObjectURL(file), file);
        }}
      />
    </div>
  );
}