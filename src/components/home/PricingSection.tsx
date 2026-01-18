import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Users, Zap, Crown } from "lucide-react";

const PricingSection = () => {
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");

  const plans = [
    {
      name: "Forever Free",
      description: "Perfect for trying out",
      price: { USD: 0, INR: 0 },
      period: "forever",
      minutes: 30,
      icon: Sparkles,
      features: [
        "30 minutes/month",
        "Basic transcription",
        "5 languages",
        "TXT & SRT export",
        "Email support",
      ],
      popular: false,
      cta: "Start Free",
      variant: "outline" as const,
    },
    {
      name: "Starter",
      description: "For casual creators",
      price: { USD: 2.99, INR: 249 },
      period: "month",
      minutes: 120,
      icon: Zap,
      features: [
        "120 minutes/month",
        "Advanced AI accuracy",
        "20 languages",
        "All export formats",
        "Priority email support",
        "Remove watermark",
      ],
      popular: false,
      cta: "Get Started",
      variant: "outline" as const,
    },
    {
      name: "Pro",
      description: "Most popular choice",
      price: { USD: 4.99, INR: 416 },
      period: "month",
      minutes: 300,
      icon: Crown,
      features: [
        "300 minutes/month",
        "99% accuracy guarantee",
        "50+ languages",
        "All export formats",
        "Speaker detection",
        "Priority support",
        "API access",
        "Custom vocabulary",
      ],
      popular: true,
      cta: "Go Pro",
      variant: "default" as const,
    },
    {
      name: "Team",
      description: "For growing teams",
      price: { USD: 9.99, INR: 832 },
      period: "month",
      minutes: 1000,
      icon: Users,
      features: [
        "1000 minutes/month",
        "Everything in Pro",
        "5 team members",
        "Team collaboration",
        "Admin dashboard",
        "SSO integration",
        "Dedicated support",
        "Custom branding",
      ],
      popular: false,
      cta: "Contact Sales",
      variant: "secondary" as const,
    },
  ];

  const formatPrice = (price: number) => {
    if (currency === "USD") {
      return price === 0 ? "Free" : `$${price}`;
    }
    return price === 0 ? "Free" : `₹${price}`;
  };

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-accent/10 text-accent font-medium rounded-full text-sm mb-4">
            Simple, Affordable Pricing
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Plans That <span className="gradient-text">Fit Your Budget</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Start free, upgrade when you need. No hidden fees, cancel anytime.
          </p>

          {/* Currency Toggle */}
          <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-full">
            <button
              onClick={() => setCurrency("USD")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                currency === "USD"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency("INR")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                currency === "INR"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              INR (₹)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-card rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                plan.popular
                  ? "border-primary shadow-glow ring-2 ring-primary"
                  : "border-border"
              }`}
            >
              {/* Popular badge */}
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
                    {formatPrice(plan.price[currency])}
                  </span>
                  {plan.price[currency] > 0 && (
                    <span className="text-muted-foreground">/{plan.period}</span>
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

              <Link to="/signup" className="block">
                <Button
                  variant={plan.variant}
                  className="w-full"
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Money back guarantee */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-secondary/10 border border-secondary/20 rounded-full">
            <span className="text-secondary font-semibold">💰 30-Day Money-Back Guarantee</span>
            <span className="text-muted-foreground">— No questions asked</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
