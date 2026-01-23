import React from 'react';

const Privacy: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto bg-card border border-border p-8 rounded-xl">
        <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>

        <p className="text-muted-foreground">
          This Privacy Policy explains how Tanzify collects, uses, and shares personal information. We are committed
          to protecting your privacy.
        </p>

        <section className="mt-6">
          <h2 className="font-semibold">1. Information We Collect</h2>
          <ul className="list-disc ml-6 mt-2 text-sm text-muted-foreground space-y-1">
            <li>Account information (email, display name).</li>
            <li>Uploaded audio files, transcripts, and metadata (duration, language).</li>
            <li>Usage metrics and error logs for service improvements.</li>
          </ul>
        </section>

        <section className="mt-4">
          <h2 className="font-semibold">2. How We Use Information</h2>
          <p className="text-sm text-muted-foreground mt-2">
            We use the data to provide the service (transcription, storage), to improve features, and to communicate
            account-related notices. We do not use your content to train models without explicit consent.
          </p>
        </section>

        <section className="mt-4">
          <h2 className="font-semibold">3. Sharing and Disclosure</h2>
          <p className="text-sm text-muted-foreground mt-2">
            We may share data with service providers (storage, payment processors) necessary to operate the service.
            We do not sell personal data to third parties.
          </p>
        </section>

        <section className="mt-4">
          <h2 className="font-semibold">4. Security and Retention</h2>
          <p className="text-sm text-muted-foreground mt-2">
            We store data securely and retain it only as long as needed to provide the service or as required by law.
            Contact support for deletion or export requests.
          </p>
        </section>

        <section className="mt-4">
          <h2 className="font-semibold">5. Your Rights</h2>
          <p className="text-sm text-muted-foreground mt-2">
            You may request access, correction, or deletion of your personal data by contacting support. We will
            respond per applicable law.
          </p>
        </section>

        <section className="mt-6 text-sm text-muted-foreground">
          <p>Contact: support@tanzify.ai</p>
          <p className="mt-2">Last updated: January 2026</p>
        </section>
      </div>
    </main>
  );
};

export default Privacy;
