import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-vellera-dark text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-vellera-blue mb-8 hover:text-vellera-green transition">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-5xl font-black mb-4">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: April 4, 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Vellera ("the App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on Vellera for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on Vellera</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">3. Disclaimer of Warranties</h2>
            <p>
              The materials on Vellera are provided on an "as is" basis. Vellera makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
            <p className="mt-4">
              <strong>Health Disclaimer:</strong> Vellera is not a substitute for professional medical advice. Always consult with a healthcare provider before starting any new fitness program, especially if you have pre-existing health conditions or injuries.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">4. Limitations of Liability</h2>
            <p>
              In no event shall Vellera or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Vellera, even if Vellera or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">5. Accuracy of Materials</h2>
            <p>
              The materials appearing on Vellera could include technical, typographical, or photographic errors. Vellera does not warrant that any of the materials on its App are accurate, complete, or current. Vellera may make changes to the materials contained on its App at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">6. Links</h2>
            <p>
              Vellera has not reviewed all of the sites linked to its App and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Vellera of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">7. Modifications</h2>
            <p>
              Vellera may revise these terms of service for its App at any time without notice. By using this App, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts located in New York.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-vellera-blue mb-3">9. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at <a href="mailto:hello@vellera.io" className="text-vellera-blue hover:text-vellera-green transition">hello@vellera.io</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}