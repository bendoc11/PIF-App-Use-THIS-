import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="text-4xl font-heading mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: March 30, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">1. Information We Collect</h2>
            <p>When you create an account, we collect your name, email address, phone number, and profile information such as age, height, position, and training preferences. We also collect usage data including drill completions, game logs, shooting statistics, and training activity to personalize your experience.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide and personalize the Play it Forward Basketball training platform</li>
              <li>To track your progress, generate player ratings, and recommend workouts</li>
              <li>To process payments and manage your subscription</li>
              <li>To send important updates about your account or the service</li>
              <li>To improve our platform and develop new features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">3. Payment Processing</h2>
            <p>We use Stripe to process payments. Your payment card details are handled directly by Stripe and are never stored on our servers. Please review <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe's Privacy Policy</a> for more information.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">4. Data Storage & Security</h2>
            <p>Your data is stored securely using industry-standard encryption and access controls. We use secure cloud infrastructure to host our services. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, or destruction.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">5. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with third-party service providers who help us operate the platform (e.g., payment processing, email delivery, analytics). These providers are contractually obligated to protect your data and use it only for the services they provide to us.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">6. Community Content</h2>
            <p>Posts and replies you make in the community section are visible to other users. Your display name and avatar are shown alongside your community contributions. You can control your display name in your profile settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">7. Cookies & Analytics</h2>
            <p>We use essential cookies to maintain your session and authentication state. We may use analytics tools to understand how users interact with our platform in order to improve the experience.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">8. Your Rights</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access and download your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Cancel your subscription at any time through the billing portal</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">9. Children's Privacy</h2>
            <p>Our service is not directed to children under 13. If you are under 13, please use the platform only with parental consent and supervision. We do not knowingly collect personal information from children under 13 without parental consent.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the platform or sending you an email.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">11. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or your data, please contact us at <a href="mailto:support@playitforwardbball.com" className="text-primary hover:underline">support@playitforwardbball.com</a>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Play it Forward Basketball. All rights reserved.
        </div>
      </div>
    </div>
  );
}
