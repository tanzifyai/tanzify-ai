import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/config";
import { Users, Zap } from "lucide-react";

const LiveCounter = () => {
  const [userCount, setUserCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const fetchLiveStats = async () => {
    try {
      const url = `${API_BASE}/api/live-stats`;
      const response = await fetch(url);
      const data = await response.json();
      setUserCount(data.activeUsers || 0);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    } catch (error) {
      console.error('Failed to fetch live stats:', error);
    }
  };

  useEffect(() => {
    fetchLiveStats(); // Initial fetch
    const interval = setInterval(fetchLiveStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-full">
      <div className="relative">
        <div className="w-2.5 h-2.5 bg-secondary rounded-full animate-pulse" />
        <div className="absolute inset-0 w-2.5 h-2.5 bg-secondary rounded-full animate-ping opacity-75" />
      </div>
      <span className="flex items-center gap-1.5 text-sm font-medium text-secondary">
        <Users className="w-4 h-4" />
        <span className={`transition-all duration-300 ${isAnimating ? 'scale-110' : ''}`}>
          {userCount.toLocaleString()}
        </span>
        users transcribing now
        <Zap className="w-3.5 h-3.5 text-accent" />
      </span>
    </div>
  );
};

export default LiveCounter;
