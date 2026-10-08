import { useEffect, useRef, useState } from "react";
import { fileToDataUrl } from "../images";

type CameraCaptureProps = {
  labelKm: string;
  labelEn: string;
  value?: string;
  onChange: (value: string | undefined) => void;
};

export function CameraCapture({ labelKm, labelEn, value, onChange }: CameraCaptureProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function stop() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLive(false);
  }

  useEffect(() => stop, []);

  useEffect(() => {
    if (!live || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => setMessage("The camera preview did not start. Choose a photo instead."));
  }, [live]);

  async function start() {
    setMessage(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("This browser has no camera access. Choose a photo instead.");
      fileRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      setLive(true);
    } catch {
      setMessage("The camera is unavailable. Choose a photo instead.");
      fileRef.current?.click();
    }
  }

  function snap() {
    const video = videoRef.current;
    if (!video) return;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const scale = Math.min(1, 960 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    onChange(canvas.toDataURL("image/jpeg", 0.72));
    stop();
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      onChange(await fileToDataUrl(file));
      setMessage(null);
    } catch {
      setMessage("That photo could not be read. Try another one.");
    }
  }

  return (
    <div className="capture">
      <div className="capture-label">
        <span lang="km">{labelKm}</span>
        <span>{labelEn}</span>
      </div>
      {value ? (
        <img src={value} alt={`${labelEn} preview`} />
      ) : (
        <div className="capture-empty">
          <span lang="km">{labelKm}</span>
          <span>Ready for a snap</span>
        </div>
      )}
      <div className="capture-actions">
        <button type="button" className="btn btn-primary" onClick={() => void start()}>
          Snap · ថត
        </button>
        <button type="button" className="btn btn-line" onClick={() => fileRef.current?.click()}>
          Choose photo
        </button>
        {value && (
          <button type="button" className="btn btn-line" onClick={() => onChange(undefined)}>
            Remove
          </button>
        )}
      </div>
      {message && <p className="help">{message}</p>}
      <input
        ref={fileRef}
        className="hidden-file"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => {
          void onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {live && (
        <div className="camera-modal" role="dialog" aria-modal="true" aria-label={labelEn}>
          <video ref={videoRef} playsInline muted />
          <div className="capture-actions">
            <button type="button" className="btn btn-gold" onClick={snap}>
              Take photo · ថតរូប
            </button>
            <button type="button" className="btn btn-line light" onClick={stop}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
