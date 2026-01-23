import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

const Profile: React.FC = () => {
  const { user, logout, saveProfile } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await saveProfile({ name });
    } catch (error) {
      console.error('Failed to save profile', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-card border border-border p-8 rounded-xl">
          <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
          <p className="text-muted-foreground">You are not signed in.</p>
          <Link to="/login">
            <Button className="mt-4">Sign in</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto bg-card border border-border p-8 rounded-xl">
        <h1 className="text-2xl font-bold mb-4">Your Profile</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground">Email</label>
            <Input value={user.email} disabled className="mt-1" />
          </div>

          <div className="flex gap-4 items-center">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
            <Link to="/settings">
              <Button variant="outline">Settings</Button>
            </Link>
            <Button variant="destructive" onClick={() => logout()}>
              Logout
            </Button>
          </div>

          <div className="pt-4 border-t border-border text-sm text-muted-foreground">
            <p>
              <strong>Credits:</strong> {user.credits}
            </p>
            <p>
              <strong>Minutes used:</strong> {user.minutes_used}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Profile;
