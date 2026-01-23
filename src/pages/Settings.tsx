import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type SettingsState = {
  emailNotifications: boolean;
  autoTranscribe: boolean;
};

const SETTINGS_KEY = 'tanzify_settings_v1';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsState>({
    emailNotifications: true,
    autoTranscribe: true,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings(JSON.parse(raw));
    } catch (e) {
      console.warn('Failed to read settings', e);
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });
    } catch (e) {
      console.error('Failed to save settings', e);
      toast({ title: 'Save failed', description: 'Could not persist settings locally.' });
    }
  };

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto bg-card border border-border p-8 rounded-xl">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <p className="mb-6 text-muted-foreground">Manage your account preferences and integrations.</p>

        <section className="mb-6">
          <h2 className="font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">Name: {user?.name || '—'}</p>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold">Preferences</h2>
          <div className="mt-3 space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
              />
              <span className="text-sm text-muted-foreground">Email notifications for transcriptions and billing</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.autoTranscribe}
                onChange={(e) => setSettings({ ...settings, autoTranscribe: e.target.checked })}
              />
              <span className="text-sm text-muted-foreground">Automatically transcribe uploaded recordings</span>
            </label>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold">Integrations</h2>
          <p className="text-sm text-muted-foreground">Connect storage providers or developer tools (coming soon).</p>
        </section>

        <div className="mt-6 flex gap-3">
          <Button onClick={handleSave}>Save settings</Button>
        </div>
      </div>
    </main>
  );
};

export default Settings;
