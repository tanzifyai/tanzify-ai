import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Account: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleManageBilling = () => {
    toast({ title: 'Billing', description: 'Open billing portal (not implemented in this demo).' });
  };

  const handleAddPayment = () => {
    toast({ title: 'Payment methods', description: 'Add payment method flow not implemented.' });
  };

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto bg-card border border-border p-8 rounded-xl">
        <h1 className="text-2xl font-bold mb-4">Account & Billing</h1>
        <p className="mb-6 text-muted-foreground">Manage your subscription, billing details, and invoices.</p>

        <section className="mb-6">
          <h2 className="font-semibold">Subscription</h2>
          <p className="text-sm text-muted-foreground">
            {user?.subscription || 'Free plan'} — {user?.subscription ? 'Active' : 'No active paid subscription'}
          </p>
          <div className="mt-4">
            <Button onClick={handleManageBilling}>Manage subscription</Button>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold">Payment Methods</h2>
          <p className="text-sm text-muted-foreground">You have no saved payment methods.</p>
          <div className="mt-3">
            <Button variant="outline" onClick={handleAddPayment}>
              Add payment method
            </Button>
          </div>
        </section>

        <section>
          <h2 className="font-semibold">Invoices</h2>
          <p className="text-sm text-muted-foreground">Invoices and receipts will appear here after you subscribe.</p>
        </section>
      </div>
    </main>
  );
};

export default Account;
