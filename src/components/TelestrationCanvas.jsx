import { useRef, useState } from 'react';
import { Trash2, Undo2, Download } from 'lucide-react';

/**
 * TelestrationCanvas: Draw annotations over video frame
 * Coach marks up student technique in real-time
 */
export default function TelestrationCanvas({ videoFrame, onSave }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#00E5FF');
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState([]);

  const startDrawing = (e) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (canvasRef.current) {
      const imageData = canvasRef.current.toDataURL();
      setHistory([...history, imageData]);
    }
    setIsDrawing(false);
  };

  const undo = () => {
    if (history.length === 0) return;
    const ctx = canvasRef.current.getContext('2d');
    const newHistory = [...history];
    newHistory.pop();

    // Redraw previous state
    if (newHistory.length > 0) {
      const img = new Image();
      img.src = newHistory[newHistory.length - 1];
      img.onload = () => ctx.drawImage(img, 0, 0);
      setHistory(newHistory);
    } else {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHistory([]);
    }
  };

  const clear = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHistory([]);
  };

  const saveAnnotation = () => {
    if (onSave && canvasRef.current) {
      const annotatedImage = canvasRef.current.toDataURL('image/png');
      onSave(annotatedImage);
    }
  };

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div className="relative bg-black rounded-lg overflow-hidden border-2 border-vellera-blue">
        {videoFrame && (
          <img 
            src={videoFrame} 
            alt="frame" 
            className="w-full h-auto"
            onLoad={(e) => {
              const canvas = canvasRef.current;
              if (canvas) {
                canvas.width = e.target.width;
                canvas.height = e.target.height;
              }
            }}
          />
        )}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      {/* Toolbar */}
      <div className="bg-commander-surface border border-commander-border rounded-xl p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-white text-xs font-bold uppercase">Pen Color</label>
          <div className="flex gap-2">
            {['#00E5FF', '#CCFF00', '#FF4444', '#FFFFFF'].map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg border-2 transition ${
                  color === c ? 'border-white' : 'border-gray-700'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-white text-xs font-bold uppercase">Line Width</label>
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={e => setLineWidth(parseInt(e.target.value))}
            className="w-full"
          />
          <p className="text-commander-muted text-xs">{lineWidth}px</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-lg py-2 text-white text-xs font-bold disabled:opacity-50"
          >
            <Undo2 className="w-3 h-3" />
            Undo
          </button>
          <button
            onClick={clear}
            className="flex items-center justify-center gap-2 bg-red-900/40 hover:bg-red-900/60 rounded-lg py-2 text-red-400 text-xs font-bold"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
          <button
            onClick={saveAnnotation}
            className="flex items-center justify-center gap-2 bg-vellera-blue/20 hover:bg-vellera-blue/30 rounded-lg py-2 text-vellera-blue text-xs font-bold"
          >
            <Download className="w-3 h-3" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}