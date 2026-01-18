import { Upload, Cpu, Download, ArrowRight } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      number: "01",
      title: "Upload Your Audio",
      description: "Drag & drop any audio file. We support MP3, WAV, M4A, and 20+ formats up to 100MB.",
      color: "primary",
    },
    {
      icon: Cpu,
      number: "02",
      title: "AI Transcribes",
      description: "Our advanced AI processes your audio in seconds with 99% accuracy across 50+ languages.",
      color: "secondary",
    },
    {
      icon: Download,
      number: "03",
      title: "Download & Share",
      description: "Get your transcript instantly. Edit, export to multiple formats, or share with your team.",
      color: "accent",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "primary":
        return {
          bg: "bg-primary/10",
          border: "border-primary/20",
          icon: "text-primary",
          number: "text-primary",
        };
      case "secondary":
        return {
          bg: "bg-secondary/10",
          border: "border-secondary/20",
          icon: "text-secondary",
          number: "text-secondary",
        };
      case "accent":
        return {
          bg: "bg-accent/10",
          border: "border-accent/20",
          icon: "text-accent",
          number: "text-accent",
        };
      default:
        return {
          bg: "bg-primary/10",
          border: "border-primary/20",
          icon: "text-primary",
          number: "text-primary",
        };
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary font-medium rounded-full text-sm mb-4">
            Simple 3-Step Process
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            How <span className="gradient-text">Tanzify AI</span> Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From audio to accurate transcript in under 60 seconds. No learning curve, no complicated setup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const colors = getColorClasses(step.color);
            return (
              <div key={index} className="relative group">
                {/* Connector line for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-border via-border to-transparent">
                    <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                )}

                <div className="relative bg-card rounded-2xl p-8 border border-border card-hover">
                  {/* Step number */}
                  <span className={`absolute -top-4 -right-4 font-heading text-6xl font-bold ${colors.number} opacity-10`}>
                    {step.number}
                  </span>

                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className={`w-8 h-8 ${colors.icon}`} />
                  </div>

                  {/* Content */}
                  <h3 className="font-heading text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
