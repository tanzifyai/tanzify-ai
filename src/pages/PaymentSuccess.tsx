import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Crown, Zap, Users, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PlanDetails {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  minutes: number;
  features: string[];
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [planDetails, setPlanDetails] = useState<{
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    minutes: number;
    features: string[];
  } | null>(null);

  useEffect(() => {
    // Get plan details from URL params or session
    const planId = searchParams.get('plan');
    const sessionId = searchParams.get('session_id');

    // In a real implementation, you'd verify the payment with your backend
    // For now, we'll just show success based on the plan parameter

    const planMap: Record<string, PlanDetails> = {
      'starter-monthly': {
        name: 'Starter',
        icon: Zap,
        minutes: 60,
        features: ['60 minutes/month', 'Clean exports', 'All formats', 'Priority support']
      },
      'pro-monthly': {
        name: 'Pro',
        icon: Crown,
        minutes: 150,
        features: ['150 minutes/month', 'Priority processing', 'API access', 'Advanced features']
      },
      'team-monthly': {
        name: 'Team',
        icon: Users,
        minutes: 400,
        features: ['400 minutes/month', 'Team collaboration', '5 members', 'Admin dashboard']
      }
    };

    if (planId && planMap[planId]) {
      setPlanDetails(planMap[planId]);
    }
  }, [searchParams]);

  if (!planDetails) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="font-heading text-3xl font-bold mb-4">Payment Processing...</h1>
              <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="font-heading text-4xl font-bold mb-2">
                Welcome to {planDetails.name} Plan!
              </h1>
              <p className="text-muted-foreground text-lg">
                Your payment was successful. You now have access to all {planDetails.name} features.
              </p>
            </div>

            {/* Plan Details Card */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <planDetails.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{planDetails.name} Plan</CardTitle>
                    <CardDescription>{planDetails.minutes} minutes per month</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium mb-3">What's included:</h4>
                  <ul className="space-y-2">
                    {planDetails.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <div className="text-center space-y-4">
              <h3 className="font-heading text-xl font-bold">Ready to get started?</h3>
              <p className="text-muted-foreground">
                Your account has been upgraded and your usage limits have been reset.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/upload">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Transcribing
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </div>

            {/* Support Info */}
            <div className="mt-12 text-center">
              <p className="text-sm text-muted-foreground">
                Need help? Contact our support team at{" "}
                <a href="mailto:support@tanzify.ai" className="text-primary hover:underline">
                  support@tanzify.ai
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;