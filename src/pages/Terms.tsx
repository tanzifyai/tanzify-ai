import React from 'react';

const Terms: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto bg-card border border-border p-8 rounded-xl">
        <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>

        <p className="text-muted-foreground">
          These Terms of Service govern your use of the Tanzify web application. By using the service you agree
          to these terms. If you do not agree, do not use the service.
        </p>

        <section className="mt-6">
          <h2 className="font-semibold">1. Use of the Service</h2>
          <p className="text-sm text-muted-foreground mt-2">
            You may use Tanzify only in compliance with applicable laws and these terms. You are responsible for the
            content you upload and must not upload illegal, infringing, or offensive material.
          </p>
        </section>

        <section className="mt-4">
          <h2 className="font-semibold">2. Accounts</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Accounts are for individual use. Keep your credentials secure. We reserve the right to suspend or terminate
            accounts that violate these terms.
          </p>
        </section>

        <section className="mt-4">
          <h2 className="font-semibold">3. Payments and Subscriptions</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Paid features require a subscription. Billing, refunds, and cancellations are handled through the billing
            portal and your payment provider. Contact support for billing disputes.
          </p>
        </section>

        <section className="mt-4">
          <h2 className="font-semibold">4. Intellectual Property</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Tanzify and its content are owned by the service provider. You retain ownership of content you upload but
            grant Tanzify a limited license to operate, store, and display your content as necessary to provide the
            service.
          </p>
        </section>

        <section className="mt-4">
          <h2 className="font-semibold">5. Termination</h2>
          <p className="text-sm text-muted-foreground mt-2">
            We may suspend or terminate your access for violations or inactivity. Upon termination, certain data may be
            deleted according to our retention policy.
          </p>
        </section>

        <section className="mt-4">
          <h2 className="font-semibold">6. Liability</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Tanzify provides the service AS IS. To the maximum extent permitted by law, we disclaim warranties and
            limitations of liability for indirect or consequential damages.
          </p>
        </section>

        <section className="mt-6 text-sm text-muted-foreground">
          <p>Last updated: January 2026</p>
        </section>
      </div>
    </main>
  );
};

export default Terms;
