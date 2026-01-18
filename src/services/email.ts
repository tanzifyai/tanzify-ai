// import nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransporter({
//   host: process.env.EMAIL_HOST,
//   port: parseInt(process.env.EMAIL_PORT || '587'),
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const emailService = {
  async sendEmail(options: EmailOptions): Promise<void> {
    // Temporarily disabled for frontend - implement backend API for email sending
    console.log('Email would be sent:', options);
    // try {
    //   const mailOptions = {
    //     from: `"Tanzify AI" <${process.env.EMAIL_USER}>`,
    //     to: options.to,
    //     subject: options.subject,
    //     html: options.html,
    //     text: options.text,
    //   };

    //   const info = await transporter.sendMail(mailOptions);
    //   console.log('Email sent:', info.messageId);
    // } catch (error) {
    //   console.error('Error sending email:', error);
    //   throw error;
    // }
  },

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Welcome to Tanzify AI, ${name}!</h1>
        <p>Thank you for joining our AI-powered transcription service.</p>
        <p>You've received <strong>10 minutes</strong> of free transcription credits to get started.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Getting Started:</h3>
          <ol>
            <li>Upload your first audio file</li>
            <li>Choose your preferred language</li>
            <li>Get instant AI transcription</li>
          </ol>
        </div>
        <a href="${window.location.origin}/upload" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Start Transcribing
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions, feel free to reply to this email.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to Tanzify AI - Your AI Transcription Journey Begins!',
      html,
    });
  },

  async sendTranscriptionCompleteEmail(email: string, filename: string, transcriptLength: number): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Transcription Complete!</h1>
        <p>Your audio file <strong>${filename}</strong> has been successfully transcribed.</p>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p><strong>Transcript Length:</strong> ${transcriptLength} characters</p>
          <p><strong>Processing Time:</strong> Completed in under 60 seconds</p>
        </div>
        <a href="${window.location.origin}/dashboard" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          View Transcript
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          Keep transcribing with Tanzify AI!
        </p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: `Transcription Complete: ${filename}`,
      html,
    });
  },

  async sendPaymentConfirmationEmail(email: string, planName: string, amount: number): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8b5cf6;">Payment Confirmed!</h1>
        <p>Thank you for subscribing to <strong>${planName}</strong>.</p>
        <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
          <p><strong>Plan:</strong> ${planName}</p>
          <p><strong>Amount Paid:</strong> $${(amount / 100).toFixed(2)}</p>
          <p><strong>Credits Added:</strong> Based on your plan</p>
        </div>
        <a href="${window.location.origin}/dashboard" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Access Dashboard
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          Your subscription is now active. Happy transcribing!
        </p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: `Payment Confirmed - ${planName} Subscription`,
      html,
    });
  },

  async sendLowCreditsWarning(email: string, remainingCredits: number): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">Low Credits Warning</h1>
        <p>You have <strong>${remainingCredits} minutes</strong> of transcription credits remaining.</p>
        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p>When your credits run out, you'll need to upgrade your plan to continue transcribing.</p>
        </div>
        <a href="${window.location.origin}/pricing" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Upgrade Plan
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          Don't let your transcription workflow get interrupted!
        </p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Low Credits Warning - Tanzify AI',
      html,
    });
  }
};