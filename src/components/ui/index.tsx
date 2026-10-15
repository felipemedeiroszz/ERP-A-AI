"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Edit3,
  X,
  Save,
  Power,
  PowerOff,
  Search,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Menu,
  Package,
  Truck,
  ChefHat,
  User,
  Phone,
  Clock,
  DollarSign,
  CreditCard,
  QrCode,
  ShoppingCart,
  Printer,
  Database,
  Building2,
  Store,
  Palette,
  Settings,
  Eye,
  Loader2,
  Check,
  AlertCircle,
  Home,
  Filter,
  Download,
  Upload,
  FileText,
  LogOut,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ open, title, onClose, children, size = "md" }: ModalProps) {
  if (!open) return null;
  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full bg-card rounded-2xl shadow-2xl border border-border max-h-[90vh] overflow-hidden flex flex-col",
          sizeClass
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const variantClass = {
    primary:
      "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
    destructive:
      "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
    ghost: "hover:bg-muted text-foreground",
  }[variant];
  const sizeClass = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5",
  }[size];
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition",
        variantClass,
        sizeClass,
        className
      )}
    >
      {children}
    </button>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, ...props }: InputProps) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
      <input
        {...props}
        className={cn(
          "w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition",
          className
        )}
      />
    </label>
  );
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
      <textarea
        {...props}
        className={cn(
          "w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition min-h-[80px]",
          className
        )}
      />
    </label>
  );
}

interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
      <select
        {...props}
        className={cn(
          "w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition",
          className
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        {...props}
        className={cn(
          "w-4 h-4 text-primary rounded focus:ring-primary cursor-pointer",
          className
        )}
      />
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
    </label>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({
  title = "Nenhum registro",
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="py-12 px-6 text-center bg-muted/30 rounded-xl border border-dashed border-border">
      <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
        {icon || <X size={24} />}
      </div>
      <p className="text-sm font-semibold mb-1">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {action && (
        <Button size="sm" onClick={action.onClick}>
          <Plus size={16} /> {action.label}
        </Button>
      )}
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled,
}: ToggleSwitchProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-3 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex w-11 h-6 rounded-full transition-colors items-center",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute inline-block w-5 h-5 bg-white rounded-full shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </span>
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
    </label>
  );
}

interface BadgeProps {
  color?:
    | "default"
    | "green"
    | "red"
    | "yellow"
    | "blue"
    | "purple"
    | "orange"
    | "indigo";
  children: React.ReactNode;
}

export function Badge({ color = "default", children }: BadgeProps) {
  const cls = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    green: "bg-green-100 text-green-700 border-green-200",
    red: "bg-red-100 text-red-700 border-red-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  }[color];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
        cls
      )}
    >
      {children}
    </span>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  destructive,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <Modal open={open} title={title} onClose={onCancel} size="sm">
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? "destructive" : "primary"}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function useToastAction<T extends (...args: any[]) => Promise<{ success: boolean; error?: string; message?: string }>>(
  action: T,
  options?: { success?: string; onSuccess?: () => void }
) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<T>> | null>(null);

  async function run(...args: Parameters<T>) {
    setLoading(true);
    try {
      const r = (await action(...args)) as Awaited<ReturnType<T>>;
      setResult(r);
      if (r.success) {
        toast.success(options?.success || "Operação realizada com sucesso!");
        options?.onSuccess?.();
      } else {
        toast.error(r.error || "Erro na operação");
      }
      return r;
    } catch (e: any) {
      toast.error(e?.message || "Erro inesperado");
      return { success: false, error: e?.message } as any;
    } finally {
      setLoading(false);
    }
  }

  return { run, loading, result };
}

export const Icones = {
  Plus,
  Trash2,
  Edit3,
  Save,
  Power,
  PowerOff,
  Search,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Menu,
  Package,
  Truck,
  ChefHat,
  User,
  Phone,
  Clock,
  DollarSign,
  CreditCard,
  QrCode,
  ShoppingCart,
  Printer,
  Database,
  Building2,
  Store,
  Palette,
  Settings,
  Eye,
  Loader2,
  Check,
  AlertCircle,
  Home,
  Filter,
  Download,
  Upload,
  FileText,
  LogOut,
  MoreHorizontal,
  X,
};
