import React, { useState } from 'react';
import FAQ from '@/components/home/FAQ';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const Help: React.FC = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) {
      toast({ title: 'Missing fields', description: 'Please provide your email and a message.' });
      return;
    }

    setSubmitting(true);
    try {
      // Client-side action: open default mail client as a fallback
      const subject = encodeURIComponent('Tanzify Support Request');
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      window.location.href = `mailto:support@tanzify.ai?subject=${subject}&body=${body}`;

      toast({ title: 'Contact initiated', description: 'Your mail client should open. We also received your request locally.' });
    } catch (err) {
      console.error('Contact form failed', err);
      toast({ title: 'Failed', description: 'Could not open mail client.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <section className="py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Help & Support</h1>
          <p className="text-muted-foreground mb-6">Find answers to common questions and contact support at support@tanzify.ai.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-xl font-semibold mb-3">Troubleshooting</h2>
        <ul className="list-disc ml-6 text-sm text-muted-foreground space-y-2">
          <li>If uploads fail, check your network and try a different browser.</li>
          <li>If transcription is slow, larger files take longer — try splitting long recordings.</li>
          <li>If sign-in fails in local development, check your Supabase credentials and RLS policies.</li>
          <li>For permission or RLS errors from Supabase, ask a project admin to review RLS policies.</li>
        </ul>
      </section>

      <section className="container mx-auto px-4 max-w-3xl mt-8">
        <h2 className="text-xl font-semibold mb-3">Frequently Asked Questions</h2>
        <FAQ />
      </section>

      <section className="container mx-auto px-4 max-w-3xl mt-8">
        <h2 className="text-xl font-semibold mb-3">Contact Support</h2>
        <form onSubmit={submitContact} className="space-y-4 bg-card border border-border p-6 rounded">
          <div>
            <label className="block text-sm text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground">Email *</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground">Message *</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Send message'}</Button>
            <Button variant="outline" onClick={() => { setName(''); setEmail(''); setMessage(''); }}>Clear</Button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Help;
