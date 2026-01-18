import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { razorpayService } from "@/services/razorpay";
import { Check, Sparkles, Users, Zap, Crown, Loader2 } from "lucide-react";

const Pricing = () => {
  const [currency, setCurrency] = useState<"USD" | "INR">("INR");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
      return;
    }

    if (planId === 'free') {
      // Free plan doesn't need payment
      alert('You are already on the free plan!');
      return;
    }

    setIsProcessing(true);

    try {
      await razorpayService.initiatePayment(planId, user.id, user.email, user.name);
    } catch (error) {
      console.error('Error starting payment:', error);
      alert('Failed to start payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const plans = [
    {
      name: "Free",
      description: "Perfect for trying out",
      price: 0,
      minutes: 30,
      icon: Sparkles,
      features: [
        "30 minutes/month",
        "Basic transcription",
        "TXT & SRT export",
        "Email support",
      ],
      popular: false,
      cta: "Start Free",
      variant: "outline" as const,
      planId: "free",
    },
    {
      name: "Starter",
      description: "For casual creators",
      price: 199,
      minutes: 60,
      icon: Zap,
      features: [
        "60 minutes/month",
        "Clean exports",
        "All export formats",
        "Priority email support",
        "Remove watermark",
      ],
      popular: false,
      cta: "Buy Starter",
      variant: "outline" as const,
      planId: "starter",
    },
    {
      name: "Pro",
      description: "Most popular choice",
      price: 499,
      minutes: 150,
      icon: Crown,
      features: [
        "150 minutes/month",
        "Priority processing",
        "All export formats",
        "Speaker detection",
        "Advanced accuracy",
        "API access",
        "Custom vocabulary",
      ],
      popular: true,
      cta: "Buy Pro",
      variant: "default" as const,
      planId: "pro",
    },
    {
      name: "Team",
      description: "For growing teams",
      price: 999,
      minutes: 400,
      icon: Users,
      features: [
        "400 minutes/month",
        "Everything in Pro",
        "Team collaboration",
        "5 team members",
        "Admin dashboard",
        "Shared minutes pool",
        "Dedicated support",
      ],
      popular: false,
      cta: "Buy Team",
      variant: "secondary" as const,
      planId: "team",
    },
  ];

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `₹${price}`;
  };

  const specialOffers = [
    {
      icon: GraduationCap,
      title: "Student Discount",
      description: "60% off for .edu emails",
      color: "primary",
    },
    {
      icon: Building2,
      title: "Enterprise",
      description: "Custom solutions for large teams",
      color: "secondary",
    },
    {
      icon: Headphones,
      title: "Content Creators",
      description: "Free months for testimonials",
      color: "accent",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-accent/10 text-accent font-medium rounded-full text-sm mb-4">
              Simple, Affordable Pricing
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
              Plans That <span className="gradient-text">Fit Your Budget</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Start free, upgrade when you need. Pay with UPI, cards, or any Indian payment method.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-card rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  plan.popular
                    ? "border-primary shadow-glow ring-2 ring-primary"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full whitespace-nowrap">
                      🎯 MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-xl ${plan.popular ? 'bg-primary/10' : 'bg-muted'} flex items-center justify-center mb-4`}>
                    <plan.icon className={`w-6 h-6 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading text-4xl font-bold">
                      {formatPrice(plan.price)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">
                        /month
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-secondary font-medium mt-1">
                    {plan.minutes} minutes included
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.variant} 
                  className="w-full" 
                  size="lg" 
                  onClick={() => handleSubscribe(plan.planId)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    plan.cta
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* Special Offers */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="font-heading text-2xl font-bold text-center mb-8">
              Special Programs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {specialOffers.map((offer, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl p-6 border border-border card-hover text-center"
                >
                  <div className={`w-14 h-14 rounded-xl bg-${offer.color}/10 border border-${offer.color}/20 flex items-center justify-center mx-auto mb-4`}>
                    <offer.icon className={`w-7 h-7 text-${offer.color}`} />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">{offer.title}</h3>
                  <p className="text-sm text-muted-foreground">{offer.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Money Back Guarantee */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-secondary/10 border border-secondary/20 rounded-full">
              <span className="text-secondary font-semibold">💰 30-Day Money-Back Guarantee</span>
              <span className="text-muted-foreground">— No questions asked</span>
            </div>
          </div>

          {/* FAQ Link */}
          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              Have questions about pricing?{" "}
              <Link to="/#faq" className="text-primary font-semibold hover:underline">
                Check our FAQ
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
