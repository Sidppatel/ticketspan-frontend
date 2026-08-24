import { useState } from 'react';
import { createFeedback } from '@/features/admin/services/feedbackService';
import { useAuth } from '@/shared/auth/useAuth';
import { rpcErrorMessage } from '@/shared/session';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { MessageSquarePlus, Star, Send, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export function FeedbackPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user ? `${user.firstName} ${user.lastName}`.trim() : '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [type, setType] = useState('general');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please provide your feedback or suggestions.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createFeedback({ name, email, type, message, rating });
      setDone(true);
      setMessage('');
    } catch (caught) {
      setError(rpcErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl py-8 px-4 sm:px-0">
      <Card>
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="flex items-center gap-2">
            <MessageSquarePlus className="size-5 text-primary" />
            Share Your Feedback
          </CardTitle>
          <CardDescription>
            Help us improve TicketSpan. We read every bug report, feature request, and suggestion.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {done ? (
            <div className="flex flex-col items-center py-8 text-center space-y-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-success/15 text-success">
                <CheckCircle2 className="size-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">Thank you for your feedback!</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Your notes have been sent directly to our product engineering team.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs font-semibold"
                onClick={() => setDone(false)}
              >
                Send Another Note
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fb-name" className="text-xs">Your Name</Label>
                  <Input
                    id="fb-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fb-email" className="text-xs">Email Address</Label>
                  <Input
                    id="fb-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fb-type" className="text-xs">Feedback Category</Label>
                  <Select
                    id="fb-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="h-9 text-xs"
                  >
                    <option value="general">General Suggestion</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Bug / Issue Report</option>
                    <option value="praise">Praise &amp; Compliment</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Overall Experience</Label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="rounded p-1 transition-transform hover:scale-110 focus-visible:outline-none"
                      >
                        <Star
                          className={cn(
                            'size-5 transition-colors',
                            star <= rating
                              ? 'fill-marigold text-marigold'
                              : 'fill-transparent text-muted-foreground/40',
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fb-message" className="text-xs">Message</Label>
                <Textarea
                  id="fb-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you loved or what we could do better…"
                  className="min-h-24 text-xs leading-relaxed"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full gap-1.5 text-xs font-semibold h-10 mt-2"
              >
                <Send className="size-3.5" />
                {submitting ? 'Sending Feedback…' : 'Submit Feedback'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
