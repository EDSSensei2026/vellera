import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-vellera-dark text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-vellera-blue mb-8 hover:text-vellera-green transition">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-5xl font-black mb-4">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: April 4, 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">1. Introduction</h2>
            <p>
              Vellera ("we," "us," "our," or "the App") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">2. Information We Collect</h2>
            <p className="font-semibold text-vellera-green mb-2">Personal Information</p>
            <p>
              We may collect personally identifiable information such as your name, email address, date of birth, fitness level, training history, and health data that you voluntarily provide to us.
            </p>
            <p className="font-semibold text-vellera-green mb-2 mt-4">Automatically Collected Data</p>
            <p>
              When you use Vellera, we automatically collect certain information about your device and usage patterns, including device type, operating system, app version, features used, workout data, and biometric information synced from wearable devices (Whoop, Fitbit, Polar, Strava, Google Fit, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">3. Use of Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Provide, maintain, and improve the App and our services</li>
              <li>Personalize your training experience</li>
              <li>Process transactions and send related information</li>
              <li>Send service and support messages</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Comply with legal obligations</li>
              <li>Prevent fraud and ensure account security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">5. Third-Party Integrations</h2>
            <p>
              Vellera integrates with third-party services such as Spotify, Apple Music, Whoop, Fitbit, Polar, Strava, Google Fit, Airtable, and Typeform. When you authorize these integrations, we receive permission to access certain data from these services. These third parties have their own privacy policies, and we encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">6. Sharing of Information</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share information with:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Service providers who assist us in operating the App and conducting our business</li>
              <li>Third-party integrations you explicitly authorize</li>
              <li>Law enforcement when required by law or legal process</li>
              <li>Other parties with your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">7. Your Rights</h2>
            <p>
              Depending on your location, you may have certain rights regarding your personal information, including the right to access, correct, delete, or port your data. To exercise these rights, please contact us at <a href="mailto:hello@vellera.io" className="text-vellera-blue hover:text-vellera-green transition">hello@vellera.io</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">8. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your experience on the App. You can control cookie settings through your browser preferences, though this may affect certain features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">9. Children's Privacy</h2>
            <p>
              Vellera is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will delete such information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">10. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your data at any time, subject to certain legal and operational requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">11. Changes to This Privacy Policy</h2>
            <p>
              Vellera may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this document. Your continued use of the App after any changes constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <p><strong>Email:</strong> <a href="mailto:hello@vellera.io" className="text-vellera-blue hover:text-vellera-green transition">hello@vellera.io</a></p>
              <p><strong>Web:</strong> vellera.io</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}