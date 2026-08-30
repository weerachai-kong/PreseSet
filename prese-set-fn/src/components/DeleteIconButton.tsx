import { Trash2 } from "lucide-react";

type DeleteIconButtonProps = {
  onClick: () => void;
  label: string;
  disabled?: boolean;
};

export function DeleteIconButton({
  onClick,
  label,
  disabled = false,
}: DeleteIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 rounded-lg p-2 text-danger disabled:opacity-30"
      aria-label={label}
    >
      <Trash2 className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}
