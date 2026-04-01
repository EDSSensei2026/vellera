import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { ImagePlus, Trash2, Eye, EyeOff, X, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

export default function BackgroundImageManager({ open, onOpenChange }) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");

  const load = () =>
    base44.entities.UserBackgroundImage.list("-created_date", 20)
      .then(setImages)
      .catch(() => {});

  useEffect(() => { if (open) load(); }, [open]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.UserBackgroundImage.create({
        image_url: file_url,
        caption: caption.trim() || null,
        is_active: true,
      });
      setCaption("");
      toast.success("Image added to your rotation!");
      load();
    } catch (err) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (img) => {
    await base44.entities.UserBackgroundImage.update(img.id, { is_active: !img.is_active });
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.UserBackgroundImage.delete(id);
    load();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[#1a1a1a] border-t border-gray-800">
        <DrawerHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-white">My Motivation Wall</DrawerTitle>
            <DrawerClose asChild>
              <button className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </DrawerClose>
          </div>
          <p className="text-gray-500 text-xs mt-1">Add photos of your goals, family, or anything that fuels your drive</p>
        </DrawerHeader>

        <div className="overflow-y-auto max-h-[70vh] p-4 space-y-4 pb-8">
          {/* Upload Section */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Caption (optional) — 'For my kids', 'Competition day', etc."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00E5FF]"
            />
            <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-gray-700 hover:border-[#00E5FF] cursor-pointer transition-all bg-gray-900">
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              {uploading
                ? <><Loader2 className="w-4 h-4 text-[#00E5FF] animate-spin" /><span className="text-[#00E5FF] text-sm font-semibold">Uploading...</span></>
                : <><ImagePlus className="w-4 h-4 text-gray-500" /><span className="text-gray-500 text-sm font-semibold">Tap to add a photo</span></>
              }
            </label>
          </div>

          {/* Image Grid */}
          {images.length === 0 && (
            <p className="text-center text-gray-600 text-sm py-8">No personal images yet — add your first one above!</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {images.map(img => (
              <div key={img.id} className={`relative rounded-xl overflow-hidden border-2 transition-all ${img.is_active ? "border-[#00E5FF40]" : "border-gray-800 opacity-50"}`}>
                <img src={img.image_url} alt={img.caption || "motivation"} className="w-full h-32 object-cover" />
                {img.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                    <p className="text-white text-xs truncate">{img.caption}</p>
                  </div>
                )}
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  <button
                    onClick={() => toggleActive(img)}
                    className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80"
                    title={img.is_active ? "Remove from rotation" : "Add to rotation"}
                  >
                    {img.is_active
                      ? <Eye className="w-3.5 h-3.5 text-[#00E5FF]" />
                      : <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-red-900/80"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}