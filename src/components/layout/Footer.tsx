import { Link } from "react-router-dom";
import { Zap, Sparkles, Twitter, Github, Linkedin, Mail, Shield, Lock, Award } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    product: [
      { name: "Features", path: "/#features" },
      { name: "Pricing", path: "/pricing" },
      { name: "Dashboard", path: "/dashboard" },
      { name: "Upload", path: "/upload" },
    ],
    company: [
      { name: "About Us", path: "#" },
      { name: "Blog", path: "#" },
      { name: "Careers", path: "#" },
      { name: "Contact", path: "#" },
    ],
    legal: [
      { name: "Privacy Policy", path: "#" },
      { name: "Terms of Service", path: "#" },
      { name: "GDPR", path: "#" },
      { name: "Security", path: "#" },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Mail, href: "#", label: "Email" },
  ];

  const trustBadges = [
    { icon: Shield, label: "SSL Secured" },
    { icon: Lock, label: "GDPR Compliant" },
    { icon: Award, label: "99.9% Uptime" },
  ];

  return (
    <footer className="bg-foreground text-background/80">
      {/* Trust Badges */}
      <div className="border-b border-background/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-8">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <badge.icon className="w-5 h-5 text-secondary" />
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-accent" />
              </div>
              <span className="font-heading font-bold text-xl text-background">
                Tanzify<span className="text-primary">AI</span>
              </span>
            </Link>
            <p className="text-background/60 mb-6 max-w-xs">
              Transform your audio into accurate transcripts in seconds. Powered by cutting-edge AI technology.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center hover:bg-primary transition-colors duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-heading font-semibold text-background mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-background/60 hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-heading font-semibold text-background mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-background/60 hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-heading font-semibold text-background mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-background/60 hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/60 text-sm">
            © 2024 Tanzify AI. All rights reserved.
          </p>
          <p className="text-background/60 text-sm flex items-center gap-1">
            Made with <span className="text-destructive">❤️</span> for creators worldwide
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
