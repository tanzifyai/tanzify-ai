import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Mic, FileAudio, Sparkles, CheckCircle } from "lucide-react";
import LiveCounter from "./LiveCounter";
import CountdownTimer from "./CountdownTimer";

const HeroSection = () => {
  const benefits = [
    "No credit card required",
    "30 minutes free forever",
    "99% accuracy guaranteed",
  ];

  return (
    <section className="relative min-h-screen pt-24 pb-16 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-[100px]" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-accent/20 rounded-full blur-[80px]" />
      </div>

      {/* Floating elements */}
      <div className="absolute top-32 left-[15%] animate-float opacity-20">
        <Mic className="w-12 h-12 text-primary" />
      </div>
      <div className="absolute top-48 right-[20%] animate-float delay-200 opacity-20">
        <FileAudio className="w-16 h-16 text-secondary" />
      </div>
      <div className="absolute bottom-32 left-[25%] animate-float delay-300 opacity-20">
        <Sparkles className="w-10 h-10 text-accent" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Live Counter */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <LiveCounter />
          </div>

          {/* Main Headline */}
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
            Stop Wasting Hours —{" "}
            <span className="gradient-text">Transcribe in 60 Seconds</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up delay-100">
            AI-powered audio transcription that's <strong className="text-foreground">10x faster</strong> and{" "}
            <strong className="text-foreground">99% accurate</strong>. Trusted by podcasters, journalists, and content creators worldwide.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 mb-8 animate-slide-up delay-200">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-secondary" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up delay-300">
            <Link to="/signup">
              <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                Start Free Transcription
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="heroOutline" size="xl" className="w-full sm:w-auto group">
              <Play className="w-5 h-5" />
              Watch Demo (60s)
            </Button>
          </div>

          {/* Countdown Timer */}
          <div className="max-w-xl mx-auto animate-slide-up delay-400">
            <CountdownTimer />
          </div>
        </div>

        {/* Mock Browser Preview */}
        <div className="mt-16 max-w-5xl mx-auto animate-scale-in delay-500">
          <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
            {/* Browser Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-accent/60" />
                <div className="w-3 h-3 rounded-full bg-secondary/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-background rounded-lg px-4 py-1.5 text-sm text-muted-foreground max-w-md mx-auto">
                  tanzify.ai/dashboard
                </div>
              </div>
            </div>
            
            {/* Mock Dashboard Content */}
            <div className="p-6 bg-background">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-sm text-muted-foreground mb-1">Credits Remaining</p>
                  <p className="font-heading text-2xl font-bold text-primary">28:45</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/10">
                  <p className="text-sm text-muted-foreground mb-1">Transcripts Created</p>
                  <p className="font-heading text-2xl font-bold text-secondary">47</p>
                </div>
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                  <p className="text-sm text-muted-foreground mb-1">Time Saved</p>
                  <p className="font-heading text-2xl font-bold text-accent">12.5 hrs</p>
                </div>
              </div>
              
              <div className="upload-zone flex items-center justify-center gap-3">
                <FileAudio className="w-8 h-8 text-primary" />
                <span className="text-muted-foreground">Drop your audio file here or click to upload</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
