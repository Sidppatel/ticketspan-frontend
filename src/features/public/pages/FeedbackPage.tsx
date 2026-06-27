import { useState } from 'react';
import { createFeedback } from '@/features/admin/services/feedbackService';
import { useAuth } from '@/shared/auth/useAuth';
import { rpcErrorMessage } from '@/shared/session';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function FeedbackPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [type, setType] = useState('general');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
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
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Send feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Input value={type} onChange={(e) => setType(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Rating</Label>
          <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Message</Label>
          <Input value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {done ? <p className="text-sm text-success">Thanks for the feedback.</p> : null}
        <Button onClick={submit} disabled={submitting}>
          {submitting ? 'Sending…' : 'Submit'}
        </Button>
      </CardContent>
    </Card>
  );
}
