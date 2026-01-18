import { useState, useEffect } from "react";
import { X, UserPlus } from "lucide-react";

const cities = [
  "New York", "London", "Mumbai", "Tokyo", "Paris", 
  "Sydney", "Berlin", "Toronto", "Singapore", "Dubai",
  "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune"
];

const actions = [
  "just signed up",
  "upgraded to Pro",
  "transcribed their first file",
  "saved 2 hours today",
  "joined the Team plan"
];

const SocialProofNotification = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [notification, setNotification] = useState({ city: "", action: "" });

  useEffect(() => {
    const showNotification = () => {
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      
      setNotification({ city: randomCity, action: randomAction });
      setIsVisible(true);

      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // Initial delay
    const initialTimeout = setTimeout(showNotification, 8000);
    
    // Show every 20-40 seconds
    const interval = setInterval(() => {
      showNotification();
    }, Math.random() * 20000 + 20000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-slide-up">
      <div className="bg-card border border-border rounded-xl p-4 shadow-xl max-w-xs">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
        >
          <X className="w-3 h-3" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Someone from <span className="text-primary">{notification.city}</span>
            </p>
            <p className="text-xs text-muted-foreground">{notification.action}</p>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
          Just now
        </div>
      </div>
    </div>
  );
};

export default SocialProofNotification;
