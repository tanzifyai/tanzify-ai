import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";
import PricingSection from "@/components/home/PricingSection";
import ShareReward from "@/components/home/ShareReward";
import FAQ from "@/components/home/FAQ";
import SocialProofNotification from "@/components/home/SocialProofNotification";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <Testimonials />
        <PricingSection />
        <ShareReward />
        <FAQ />
      </main>
      <Footer />
      <SocialProofNotification />
    </div>
  );
};

export default Index;
