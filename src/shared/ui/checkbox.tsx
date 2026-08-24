import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface CheckboxProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, defaultChecked, onChange, onCheckedChange, disabled, id, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState<boolean>(Boolean(defaultChecked));
    const isChecked = checked !== undefined ? Boolean(checked) : internalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (checked === undefined) {
        setInternalChecked(e.target.checked);
      }
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label
        htmlFor={id}
        className={cn(
          'relative inline-flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded-md border border-input bg-surface text-primary-foreground shadow-xs transition-[border-color,background-color,box-shadow] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
          isChecked && 'border-primary bg-primary text-primary-foreground',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          className="sr-only"
          {...props}
        />
        {isChecked && <Check className="size-3 stroke-[3]" />}
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
