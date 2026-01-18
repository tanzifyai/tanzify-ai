import { useState, useEffect } from "react";
import { Clock, Gift } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = () => {
  const calculateTimeLeft = (): TimeLeft => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // 7 days from now
    endDate.setHours(23, 59, 59, 999);
    
    const difference = endDate.getTime() - new Date().getTime();
    
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [spotsLeft, setSpotsLeft] = useState(847);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulate spots decreasing
    const spotsTimer = setInterval(() => {
      setSpotsLeft((prev) => Math.max(prev - Math.floor(Math.random() * 2), 0));
    }, 45000);

    return () => clearInterval(spotsTimer);
  }, []);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card rounded-xl border border-border shadow-lg flex items-center justify-center">
        <span className="font-heading text-2xl sm:text-3xl font-bold text-primary">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-accent/10 via-primary/10 to-secondary/10 rounded-2xl p-6 sm:p-8 border border-accent/20">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-accent animate-pulse" />
          <span className="text-accent font-semibold">LIMITED TIME OFFER</span>
          <Gift className="w-5 h-5 text-accent animate-pulse" />
        </div>
        
        <h3 className="font-heading text-xl sm:text-2xl font-bold text-center mb-2">
          First 1,000 Users Get <span className="text-accent">50% OFF</span> Forever!
        </h3>
        
        <p className="text-center text-muted-foreground mb-6">
          Only <span className="font-bold text-foreground">{spotsLeft}</span> spots remaining
        </p>

        <div className="flex justify-center gap-3 sm:gap-4">
          <TimeBlock value={timeLeft.days} label="Days" />
          <TimeBlock value={timeLeft.hours} label="Hours" />
          <TimeBlock value={timeLeft.minutes} label="Mins" />
          <TimeBlock value={timeLeft.seconds} label="Secs" />
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Offer ends soon - Don't miss out!</span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
