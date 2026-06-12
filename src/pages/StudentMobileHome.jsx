import { useState, useRef, useEffect } from 'react';
const base44 = { auth: { me: async () => ({}), isAuthenticated: async () => false }, entities: { WellnessLog: { filter: async () => [] }, WearableToken: { filter: async () => [] } } };
import { Upload, Video, Loader2, CheckCircle2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import BackButton from '../components/BackButton';

export default function StudentMobileHome() {
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [cameraSupported, setCameraSupported] = useState(false);

  useEffect(() => {
    setCameraSupported(!!navigator.mediaDevices?.getUserMedia);
  }, []);

  const handleCameraRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // For simplicity, trigger file input for camera capture
      // In production, implement MediaRecorder API for real-time recording
      toast.info('Camera access granted. Use file input to record.');
    } catch (err) {
      toast.error('Camera access denied: ' + err.message);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setUploadedUrl(res.file_url);
      toast.success('Video uploaded! Ready to submit to coach.');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!uploadedUrl) {
      toast.error('No video uploaded');
      return;
    }

    // Create task submission
    const user = await base44.auth.me();
    const today = new Date().toISOString().split('T')[0];

    try {
      await base44.entities.Task.create({
        coach_email: 'coach@example.com', // Should come from task assignment
        student_email: user.email,
        title: 'Video Submission',
        task_type: 'Form Check',
        status: 'Submitted',
        submitted_url: uploadedUrl,
        submitted_date: new Date().toISOString(),
      });

      toast.success('Submitted to coach for review!');
      setPreview(null);
      setUploadedUrl(null);
      fileInputRef.current.value = '';
    } catch (err) {
      toast.error('Submission failed: ' + err.message);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24 safe-area-top min-h-screen flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <BackButton to="/student-hub" />
        <h1 className="text-white text-xl font-black">Submit Training Video</h1>
      </div>

      {/* Upload Zone */}
      <div className="flex-1 flex flex-col">
        <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-vellera-blue rounded-2xl bg-vellera-blue/5 cursor-pointer hover:border-vellera-green transition p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          {cameraSupported && (
            <button
              onClick={handleCameraRecord}
              className="absolute top-4 right-4 bg-black/60 p-2 rounded-lg text-vellera-blue hover:bg-black/80 transition z-10"
              title="Use device camera"
            >
              <Camera className="w-5 h-5" />
            </button>
          )}

          {preview ? (
            <div className="relative w-full h-64">
              <video src={preview} className="w-full h-full object-cover rounded-lg" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                <p className="text-white text-sm font-semibold">Tap to change</p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3">
              {uploading ? (
                <>
                  <Loader2 className="w-12 h-12 text-vellera-blue mx-auto animate-spin" />
                  <p className="text-white font-bold">Uploading...</p>
                </>
              ) : (
                <>
                  <Video className="w-12 h-12 text-vellera-blue mx-auto" />
                  <div>
                    <p className="text-white font-bold">Tap to record</p>
                    <p className="text-commander-muted text-xs mt-1">BJJ, lifting, drills, sparring</p>
                  </div>
                </>
              )}
            </div>
          )}
        </label>
      </div>

      {/* Upload Status */}
      {uploadedUrl && (
        <div className="bg-vellera-green/10 border border-vellera-green/40 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-vellera-green shrink-0" />
          <div>
            <p className="text-vellera-green font-bold text-sm">Video ready</p>
            <p className="text-commander-muted text-xs">Click submit to send to your coach</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!uploadedUrl || uploading}
        className="w-full py-4 rounded-xl bg-vellera-green text-black font-black text-lg flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload className="w-5 h-5" />
        {uploading ? 'Uploading...' : 'Submit to Coach'}
      </button>
    </div>
  );
}