import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from '@/shared/ui/input';
import { cn } from '@/shared/lib/cn';

export interface PasswordInputProps extends InputProps {
  /**
   * Optional custom duration (ms) to keep password visible during reveal before auto-masking.
   * Default: 5000ms (5s).
   */
  revealDurationMs?: number;
  /**
   * If true, limits the reveal action to strictly 1 time per input session/mount.
   * Default: true.
   */
  oneTimeOnly?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, revealDurationMs = 5000, oneTimeOnly = true, onChange, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [hasBeenRevealed, setHasBeenRevealed] = React.useState(false);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearRevealTimer = React.useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }, []);

    const maskPassword = React.useCallback(() => {
      clearRevealTimer();
      setIsVisible(false);
    }, [clearRevealTimer]);

    const handleToggleVisibility = React.useCallback(() => {
      if (isVisible) {
        maskPassword();
        return;
      }

      if (oneTimeOnly && hasBeenRevealed) {
        return;
      }

      setIsVisible(true);
      setHasBeenRevealed(true);

      clearRevealTimer();
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, revealDurationMs);
    }, [isVisible, oneTimeOnly, hasBeenRevealed, maskPassword, clearRevealTimer, revealDurationMs]);

    // Security Hardening 1: Auto-mask on page visibility change or window blur (shoulder-surfing prevention)
    React.useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          maskPassword();
        }
      };

      const handleBlurWindow = () => {
        maskPassword();
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlurWindow);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlurWindow);
        clearRevealTimer();
      };
    }, [maskPassword, clearRevealTimer]);

    const isDisabledToggle = oneTimeOnly && hasBeenRevealed && !isVisible;

    return (
      <div className="relative flex items-center w-full">
        <Input
          {...props}
          ref={ref}
          type={isVisible ? 'text' : 'password'}
          onChange={(e) => {
            // Reset revealed flag if user clears field completely
            if (e.target.value === '' && oneTimeOnly) {
              setHasBeenRevealed(false);
              maskPassword();
            }
            if (onChange) onChange(e);
          }}
          className={cn('pr-10', className)}
        />
        <button
          type="button"
          onClick={handleToggleVisibility}
          disabled={isDisabledToggle || props.disabled}
          title={
            isDisabledToggle
              ? 'Password has already been revealed once for security.'
              : isVisible
                ? 'Hide password'
                : 'View password once'
          }
          aria-label={
            isDisabledToggle
              ? 'Password revealed limit reached'
              : isVisible
                ? 'Hide password'
                : 'View password once'
          }
          className={cn(
            'absolute right-3 flex items-center justify-center text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4 text-primary animate-pulse" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
