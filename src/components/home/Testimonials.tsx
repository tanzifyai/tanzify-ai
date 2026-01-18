import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Podcast Host",
      avatar: "SC",
      content: "Tanzify AI cut my transcription time from 4 hours to 5 minutes. The accuracy is incredible, even with multiple speakers!",
      rating: 5,
      highlight: "4 hours → 5 minutes",
    },
    {
      name: "Marcus Johnson",
      role: "Journalist",
      avatar: "MJ",
      content: "I've tried 10+ transcription tools. Tanzify is the only one that handles my interview recordings perfectly. Game changer!",
      rating: 5,
      highlight: "Best in class",
    },
    {
      name: "Priya Sharma",
      role: "Content Creator",
      avatar: "PS",
      content: "The pricing is unbeatable. I'm paying less than $5/month and getting better results than expensive enterprise tools.",
      rating: 5,
      highlight: "< $5/month",
    },
    {
      name: "Alex Rivera",
      role: "YouTuber",
      avatar: "AR",
      content: "I use Tanzify for all my video captions now. The Hindi transcription is spot-on. Highly recommend for multilingual creators!",
      rating: 5,
      highlight: "50+ Languages",
    },
    {
      name: "Emma Wilson",
      role: "Student",
      avatar: "EW",
      content: "With the student discount, I transcribe all my lecture recordings for almost nothing. My grades have literally improved!",
      rating: 5,
      highlight: "60% Student Discount",
    },
    {
      name: "David Kim",
      role: "Researcher",
      avatar: "DK",
      content: "The accuracy on technical terms amazed me. It correctly transcribed medical terminology that others always got wrong.",
      rating: 5,
      highlight: "99% Accuracy",
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-secondary/10 text-secondary font-medium rounded-full text-sm mb-4">
            Loved by 10,000+ Users
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            What Our <span className="gradient-text-success">Users Say</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Don't just take our word for it. Here's what real users are saying about Tanzify AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 border border-border card-hover relative"
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />

              {/* Highlight badge */}
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-4">
                {testimonial.highlight}
              </span>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { value: "10K+", label: "Happy Users" },
            { value: "1M+", label: "Minutes Transcribed" },
            { value: "4.9/5", label: "Average Rating" },
            { value: "50+", label: "Languages Supported" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <p className="font-heading text-3xl sm:text-4xl font-bold gradient-text mb-1">
                {stat.value}
              </p>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
