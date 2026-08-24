import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/auth/store';
import { Button } from '@/shared/ui/button';
import { Ticket, ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';

function StatusShell({
  code,
  icon: Icon,
  title,
  message,
  primaryAction,
  secondaryAction,
}: {
  code: string;
  icon: React.ElementType;
  title: string;
  message: string;
  primaryAction: { label: string; onClick: () => void; icon?: React.ReactNode };
  secondaryAction?: { label: string; onClick: () => void; icon?: React.ReactNode };
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-xl sm:p-10">
        <div className="pointer-events-none absolute -left-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-12 size-40 rounded-full bg-secondary/10 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center space-y-6">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-primary shadow-inner">
            <Icon className="size-8 stroke-[1.75]" />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
              {code}
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {message}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2.5 pt-2 sm:flex-row sm:justify-center">
            <Button
              onClick={primaryAction.onClick}
              className="w-full sm:w-auto"
            >
              {primaryAction.icon || <Home className="size-4" />}
              {primaryAction.label}
            </Button>
            {secondaryAction && (
              <Button
                variant="outline"
                onClick={secondaryAction.onClick}
                className="w-full sm:w-auto"
              >
                {secondaryAction.icon}
                {secondaryAction.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotAuthorizedPage() {
  const navigate = useNavigate();
  const clear = useAuthStore((state) => state.clear);

  function switchAccount() {
    clear();
    navigate('/login', { replace: true });
  }

  return (
    <StatusShell
      code="403 ACCESS DENIED"
      icon={ShieldAlert}
      title="Not Authorized"
      message="Your current session does not have permission to access this portal or resource. You may need to sign in with a different role."
      primaryAction={{
        label: 'Return Home',
        onClick: () => navigate('/'),
        icon: <Home className="size-4" />,
      }}
      secondaryAction={{
        label: 'Switch Account',
        onClick: switchAccount,
        icon: <LogIn className="size-4" />,
      }}
    />
  );
}

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <StatusShell
      code="404 NOT FOUND"
      icon={Ticket}
      title="Page Not Found"
      message="The event, pass, or page you were looking for doesn't exist or may have moved to a different url."
      primaryAction={{
        label: 'Go to Box Office',
        onClick: () => navigate('/'),
        icon: <Home className="size-4" />,
      }}
      secondaryAction={{
        label: 'Go Back',
        onClick: () => navigate(-1),
        icon: <ArrowLeft className="size-4" />,
      }}
    />
  );
}
