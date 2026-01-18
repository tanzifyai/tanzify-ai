import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "How accurate is Tanzify AI transcription?",
      answer: "Tanzify AI achieves 99% accuracy on clear audio recordings. Our advanced AI models are trained on millions of hours of audio in 50+ languages, handling accents, technical terms, and multiple speakers with ease.",
    },
    {
      question: "What audio formats are supported?",
      answer: "We support all major audio formats including MP3, WAV, M4A, FLAC, OGG, AAC, and 20+ more. You can also upload video files (MP4, MOV, AVI) and we'll extract the audio automatically. Maximum file size is 100MB.",
    },
    {
      question: "How fast is the transcription?",
      answer: "Most audio files are transcribed in under 60 seconds! A typical 30-minute podcast episode takes about 2-3 minutes. We use parallel processing to ensure you get your transcripts as fast as possible.",
    },
    {
      question: "Is my audio data secure?",
      answer: "Absolutely. We use bank-grade AES-256 encryption for all uploads and storage. Your audio files are automatically deleted after 7 days, and we never use your data to train our AI. We're fully GDPR compliant.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes! You can cancel your subscription at any time with no questions asked. If you cancel within 30 days, we offer a full refund. Your account will remain active until the end of your billing period.",
    },
    {
      question: "Do you offer student discounts?",
      answer: "Yes! Students with a valid .edu email address get 60% off all paid plans. Just sign up with your student email and the discount will be applied automatically. Educators also qualify for our academic discount.",
    },
    {
      question: "How does the referral program work?",
      answer: "For every 3 friends you refer who sign up for a paid plan, you get 1 month free! Plus, your friends get 50% off their first month. Share your unique referral link from your dashboard to start earning.",
    },
    {
      question: "What languages do you support?",
      answer: "We support 50+ languages including English, Spanish, Hindi, Mandarin, Arabic, French, German, Japanese, Portuguese, and many more. We're constantly adding new languages based on user requests.",
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary font-medium rounded-full text-sm mb-4">
            Got Questions?
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to know about Tanzify AI. Can't find the answer you're looking for? Contact our support team.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-lg transition-shadow"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <a
            href="mailto:support@tanzify.ai"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            Contact our support team →
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
