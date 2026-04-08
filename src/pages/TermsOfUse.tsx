import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="text-4xl font-heading mb-2">Terms of Use</h1>
        <p className="text-muted-foreground mb-10">Last updated: April 8, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>By downloading, installing, or using the Play it Forward Basketball application ("App"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, do not use the App.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">2. Description of Service</h2>
            <p>Play it Forward Basketball provides basketball training content including video drills, workout programs, progress tracking, shooting statistics, community features, and personalized training plans. Access to certain features requires an active paid subscription.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">3. Eligibility</h2>
            <p>You must be at least 13 years of age to use this App. If you are under 18, you represent that your parent or legal guardian has reviewed and agreed to these Terms on your behalf.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">4. Account Registration</h2>
            <p>You must create an account to access the App. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during registration.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">5. Subscription & Payment</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>The App offers a Pro subscription at $12.99/month, which includes a free 7-day trial for new subscribers.</li>
              <li>Payment is charged to your Apple ID account or payment method on file at confirmation of purchase.</li>
              <li>Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current billing period.</li>
              <li>Your account will be charged for renewal within 24 hours prior to the end of the current period at the same price.</li>
              <li>You can manage and cancel your subscription in your device's Account Settings or through our website.</li>
              <li>Any unused portion of a free trial period will be forfeited when you purchase a subscription.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">6. Free Trial</h2>
            <p>New users may be eligible for a 7-day free trial of the Pro subscription. If you do not cancel before the trial ends, your subscription will automatically convert to a paid monthly subscription at $12.99/month. You will only be eligible for one free trial per Apple ID or account.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">7. Refunds</h2>
            <p>For subscriptions purchased through the Apple App Store, refund requests must be directed to Apple in accordance with their refund policies. For subscriptions purchased through our website, please contact us at <a href="mailto:support@playitforwardbball.com" className="text-primary hover:underline">support@playitforwardbball.com</a> for refund inquiries.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">8. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Use the App for any unlawful purpose or in violation of these Terms</li>
              <li>Post offensive, abusive, or inappropriate content in community features</li>
              <li>Attempt to gain unauthorized access to other users' accounts or our systems</li>
              <li>Reproduce, distribute, or publicly display any content from the App without authorization</li>
              <li>Use automated tools to scrape or collect data from the App</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">9. Intellectual Property</h2>
            <p>All content in the App — including videos, images, text, graphics, logos, and software — is the property of Play it Forward Basketball or its licensors and is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works from any content without our prior written consent.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">10. User-Generated Content</h2>
            <p>By posting content in community features, you grant Play it Forward Basketball a non-exclusive, worldwide, royalty-free license to use, display, and distribute that content within the App. You retain ownership of your content but are responsible for ensuring it does not violate any third-party rights.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">11. Disclaimer of Warranties</h2>
            <p>The App is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the App will be uninterrupted, error-free, or free of harmful components. Basketball training involves physical activity — consult a physician before beginning any exercise program.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">12. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Play it Forward Basketball shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, arising out of or related to your use of the App.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">13. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason at our sole discretion. Upon termination, your right to use the App will cease immediately.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">14. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Continued use of the App after changes are posted constitutes your acceptance of the revised Terms. We will notify you of material changes through the App or by email.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">15. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.</p>
          </section>

          <section>
            <h2 className="text-lg font-heading text-foreground mb-3">16. Contact Us</h2>
            <p>If you have questions about these Terms, please contact us at <a href="mailto:support@playitforwardbball.com" className="text-primary hover:underline">support@playitforwardbball.com</a>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Play it Forward Basketball. All rights reserved.
        </div>
      </div>
    </div>
  );
}
