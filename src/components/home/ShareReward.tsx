import { Button } from "@/components/ui/button";
import { Twitter, Linkedin, Gift, Share2 } from "lucide-react";

const ShareReward = () => {
  const handleShare = (platform: string) => {
    const shareText = "Just discovered Tanzify AI - the fastest audio transcription tool! Get 30 FREE minutes: ";
    const shareUrl = "https://tanzify.ai?ref=share";
    
    let url = "";
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-3xl p-8 sm:p-12 border border-primary/20 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
          
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 border border-accent/30 mb-6">
              <Gift className="w-8 h-8 text-accent" />
            </div>
            
            <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-3">
              Share & Get <span className="text-accent">+10 FREE Minutes!</span>
            </h2>
            
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Love Tanzify AI? Share it with your network and earn bonus transcription minutes for each share!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => handleShare("twitter")}
                variant="outline"
                className="gap-2 border-[#1DA1F2]/30 text-[#1DA1F2] hover:bg-[#1DA1F2] hover:text-white"
              >
                <Twitter className="w-5 h-5" />
                Share on Twitter
              </Button>
              <Button 
                onClick={() => handleShare("linkedin")}
                variant="outline"
                className="gap-2 border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white"
              >
                <Linkedin className="w-5 h-5" />
                Share on LinkedIn
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-6 flex items-center justify-center gap-1">
              <Share2 className="w-3 h-3" />
              Minutes credited instantly after sharing
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShareReward;
