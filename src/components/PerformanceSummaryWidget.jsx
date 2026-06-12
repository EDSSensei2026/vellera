import { useState } from "react";
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Download, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PerformanceSummaryWidget() {
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await base44.functions.invoke("generatePerformanceSummaryPDF", {});
      
      // Create blob and trigger download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
      a.download = `Performance_Summary_${monthName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF downloaded!");
    } catch (err) {
      toast.error("Failed to generate PDF: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!recipientEmail) {
      toast.error("Enter recipient email");
      return;
    }

    setEmailing(true);
    try {
      // Generate PDF and email it
      const response = await base44.functions.invoke("generatePerformanceSummaryPDF", {});
      
      // Email the PDF (via backend function)
      await base44.functions.invoke("emailPerformanceSummary", {
        recipientEmail,
        pdfData: response.data,
      });

      toast.success(`Summary emailed to ${recipientEmail}`);
      setShowEmailForm(false);
      setRecipientEmail("");
    } catch (err) {
      toast.error("Failed to email: " + err.message);
    } finally {
      setEmailing(false);
    }
  };

  const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="bg-commander-surface border border-commander-border rounded-xl p-4">
      <p className="text-xs text-commander-muted uppercase tracking-widest font-bold mb-4">
        📊 {monthName} Performance Summary
      </p>

      <p className="text-commander-muted text-xs mb-4">
        Download or email your monthly training stats and biometric averages to share with health professionals.
      </p>

      {!showEmailForm ? (
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-900/30 border border-blue-800 text-blue-400 hover:bg-blue-900/60 rounded-lg py-2.5 font-bold text-sm transition-all min-h-[44px] disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? "Generating..." : "Download PDF"}
          </button>

          <button
            onClick={() => setShowEmailForm(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-purple-900/30 border border-purple-800 text-purple-400 hover:bg-purple-900/60 rounded-lg py-2.5 font-bold text-sm transition-all min-h-[44px]"
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="email"
            placeholder="health.pro@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full bg-gray-800 border border-commander-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 min-h-[44px]"
          />
          <div className="flex gap-2">
            <button
              onClick={handleEmailSubmit}
              disabled={emailing}
              className="flex-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg py-2 font-bold text-sm transition-all disabled:opacity-50 min-h-[44px]"
            >
              {emailing ? "Sending..." : "Send"}
            </button>
            <button
              onClick={() => {
                setShowEmailForm(false);
                setRecipientEmail("");
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 font-bold text-sm transition-all min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}