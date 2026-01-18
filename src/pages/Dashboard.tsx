import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import { 
  Upload, Clock, FileText, TrendingUp, Gift, Users, 
  Copy, Check, Download, Eye, Trash2, Plus, Award, Zap
} from "lucide-react";

const Dashboard = () => {
  const [copied, setCopied] = useState(false);
  const { user, logout } = useTranscriptions();
  const { transcriptions } = useTranscriptions();
  const referralCode = user?.email.split('@')[0].toUpperCase() + "123" || "USER123";

  const getSeasonalMessage = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    if (month === 1 && day <= 7) {
      return "🎆 NEW YEAR SPECIAL! First 1000 users get 50% OFF forever!";
    } else if (month === 2 && day >= 10 && day <= 16) {
      return "💖 Love Special! Give the gift of time - share 30 free minutes with someone!";
    } else if ((month === 10 && day >= 25) || (month === 11 && day <= 5)) {
      return "🪔 Diwali Bonus! Extra 15 minutes on us!";
    } else if ((month === 12 && day >= 20) || (month === 1 && day <= 5)) {
      return "🎄 Christmas Special! Double free minutes this holiday!";
    }
    return null;
  };

  const seasonalMessage = getSeasonalMessage();

  // Recovery magic
  const lastVisit = localStorage.getItem('lastVisit');
  const daysSinceLastVisit = lastVisit ? Math.floor((Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60 * 24)) : 0;
  localStorage.setItem('lastVisit', Date.now().toString());

  const showRecoveryOffer = daysSinceLastVisit >= 7;

  const stats = [
    {
      label: "Credits Remaining",
      value: `${user?.credits || 30}:00`,
      unit: "minutes",
      icon: Clock,
      color: "primary",
      change: "+5 min bonus",
    },
    {
      label: "Transcripts Created",
      value: transcriptions.length.toString(),
      unit: "files",
      icon: FileText,
      color: "secondary",
      change: `+${transcriptions.filter(t => {
        const today = new Date();
        const transDate = new Date(t.createdAt);
        return transDate.toDateString() === today.toDateString();
      }).length} today`,
    },
    {
      label: "Time Saved",
      value: (transcriptions.length * 0.5).toFixed(1), // Assume 30min per transcript
      unit: "hours",
      icon: TrendingUp,
      color: "accent",
      change: "vs manual transcription",
    },
    {
      label: "Referral Earnings",
      value: "3",
      unit: "months free",
      icon: Gift,
      color: "secondary",
      change: "2 more to unlock next",
    },
  ];

  const recentTranscripts = transcriptions.slice(0, 4).map(t => ({
    id: t.id,
    name: t.filename,
    date: new Date(t.createdAt).toLocaleDateString(),
    duration: `${Math.floor(t.duration)}:${String(Math.round((t.duration % 1) * 60)).padStart(2, '0')}`,
    status: t.status,
  }));

  const getColorClasses = (color: string) => {
    switch (color) {
      case "primary": return "bg-primary/10 text-primary border-primary/20";
      case "secondary": return "bg-secondary/10 text-secondary border-secondary/20";
      case "accent": return "bg-accent/10 text-accent border-accent/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`https://tanzify.ai?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold mb-1">
                {getPersonalizedMessage()}
              </h1>
              <p className="text-muted-foreground">
                You've saved {(transcriptions.length * 0.5).toFixed(1)} hours total. Amazing work! 🚀
              </p>
            </div>
            <Link to="/upload">
              <Button variant="hero" size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                New Transcription
              </Button>
            </Link>
          </div>

          {/* Seasonal Banner */}
          {seasonalMessage && (
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-6 mb-8">
              <p className="text-center text-lg font-medium">{seasonalMessage}</p>
            </div>
          )}

          {/* FOMO Banner */}
          <div className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">🔥 Limited Time: 50% OFF Lifetime!</p>
                <p className="text-sm text-muted-foreground">Only 47 spots left. Don't miss out!</p>
              </div>
              <Button variant="default" size="sm">
                Claim Now
              </Button>
            </div>
          </div>

          {/* Recovery Magic */}
          {showRecoveryOffer && (
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-6 mb-8">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">😔 We miss you! Here's 5 free minutes to get back in the groove!</p>
                <Button variant="default" size="sm">
                  Claim Free Minutes
                </Button>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 border border-border card-hover"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${getColorClasses(stat.color)} border flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="mb-2">
                  <span className="font-heading text-3xl font-bold">{stat.value}</span>
                  <span className="text-muted-foreground ml-1">{stat.unit}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-secondary mt-1">{stat.change}</p>
              </div>
            ))}
          </div>

          {/* Progress Journey */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <h2 className="font-heading text-xl font-bold mb-6">Your Transcription Journey 🧠</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                  <span className="text-2xl">🌱</span>
                </div>
                <div>
                  <p className="font-medium">Baby Steps</p>
                  <p className="text-sm text-muted-foreground">0-5 transcripts</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${transcriptions.length >= 5 ? 'bg-secondary/10 border-2 border-secondary' : 'bg-muted'} flex items-center justify-center`}>
                  <span className="text-2xl">🌿</span>
                </div>
                <div>
                  <p className="font-medium">Growing Creator</p>
                  <p className="text-sm text-muted-foreground">5-20 transcripts</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${transcriptions.length >= 20 ? 'bg-accent/10 border-2 border-accent' : 'bg-muted'} flex items-center justify-center`}>
                  <span className="text-2xl">🌳</span>
                </div>
                <div>
                  <p className="font-medium">Transcription Pro</p>
                  <p className="text-sm text-muted-foreground">20+ transcripts</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${transcriptions.length >= 50 ? 'bg-primary/10 border-2 border-primary' : 'bg-muted'} flex items-center justify-center`}>
                  <span className="text-2xl">🌲</span>
                </div>
                <div>
                  <p className="font-medium">Transcription Guru</p>
                  <p className="text-sm text-muted-foreground">50+ transcripts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          {transcriptions.length >= 3 && (
            <div className="bg-card rounded-2xl border border-border p-6 mb-8">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">🌟 You're now among the top 20% most accurate users!</p>
                <p className="text-sm text-muted-foreground mb-4">Your transcription accuracy is exceptional.</p>
                <Button variant="outline" size="sm">
                  Share Your Achievement
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Transcripts */}
            <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold">Recent Transcripts</h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b border-border">
                      <th className="pb-3 font-medium">File Name</th>
                      <th className="pb-3 font-medium hidden sm:table-cell">Duration</th>
                      <th className="pb-3 font-medium hidden md:table-cell">Date</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTranscripts.map((transcript) => (
                      <tr key={transcript.id} className="border-b border-border/50 last:border-0">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{transcript.name}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">{transcript.duration}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 hidden sm:table-cell text-sm text-muted-foreground">
                          {transcript.duration}
                        </td>
                        <td className="py-4 hidden md:table-cell text-sm text-muted-foreground">
                          {transcript.date}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Referral Section */}
            <div className="space-y-6">
              {/* Referral Card */}
              <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl border border-primary/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold">Invite Friends</h3>
                    <p className="text-sm text-muted-foreground">Get 1 month free!</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  For every <strong className="text-foreground">3 friends</strong> who sign up for a paid plan, you get <strong className="text-secondary">1 month FREE!</strong>
                </p>

                <div className="flex gap-2">
                  <div className="flex-1 bg-background/80 rounded-lg px-3 py-2 text-sm font-mono text-muted-foreground truncate">
                    tanzify.ai?ref={referralCode}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleCopyReferral}
                    className="shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Friends referred</span>
                    <span className="font-semibold">7 / 9</span>
                  </div>
                  <div className="w-full h-2 bg-background rounded-full mt-2">
                    <div className="w-[78%] h-full bg-gradient-to-r from-primary to-secondary rounded-full" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">2 more referrals to unlock next free month!</p>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  Achievements
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-xl">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <p className="font-medium text-sm">Early Adopter</p>
                      <p className="text-xs text-muted-foreground">Joined in first 1000 users</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-xl">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="font-medium text-sm">Speed Demon</p>
                      <p className="text-xs text-muted-foreground">10+ transcripts in one day</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="font-medium text-sm">Power User</p>
                      <p className="text-xs text-muted-foreground">50+ total transcriptions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/upload" className="block">
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 card-hover">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Upload Audio</p>
                  <p className="text-sm text-muted-foreground">Start a new transcription</p>
                </div>
              </div>
            </Link>
            <Link to="/pricing" className="block">
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 card-hover">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold">Upgrade Plan</p>
                  <p className="text-sm text-muted-foreground">Get more minutes</p>
                </div>
              </div>
            </Link>
            <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 card-hover cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="font-semibold">Claim Bonus</p>
                <p className="text-sm text-muted-foreground">+10 min for sharing</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
