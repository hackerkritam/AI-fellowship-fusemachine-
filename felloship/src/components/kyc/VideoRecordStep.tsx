import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Video, StopCircle, Play, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoRecordStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

const VideoRecordStep = ({ formData, updateFormData }: VideoRecordStepProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedVideo(url);
        updateFormData({ video: blob });

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          stopRecording();
        }
      }, 10000);
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to record video",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecordedVideo = () => {
    if (videoRef.current && recordedVideo) {
      videoRef.current.srcObject = null;
      videoRef.current.src = recordedVideo;
      videoRef.current.play();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          Video Verification (10 seconds)
        </h3>
        <p className="text-sm text-muted-foreground">
          Record a 10-second video for liveness verification. Look straight at the camera and ensure good lighting.
        </p>
      </div>

      <div className="border-2 border-border rounded-lg overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
      </div>

      <div className="flex gap-4 justify-center">
        {!recordedVideo && !isRecording && (
          <Button onClick={startRecording} size="lg" className="gap-2">
            <Video className="w-5 h-5" />
            Start Recording
          </Button>
        )}
        {isRecording && (
          <Button onClick={stopRecording} size="lg" variant="destructive" className="gap-2">
            <StopCircle className="w-5 h-5" />
            Stop Recording
          </Button>
        )}
        {recordedVideo && !isRecording && (
          <>
            <Button onClick={playRecordedVideo} size="lg" variant="outline" className="gap-2">
              <Play className="w-5 h-5" />
              Play Recording
            </Button>
            <Button onClick={startRecording} size="lg" variant="outline">
              Re-record
            </Button>
          </>
        )}
      </div>

      {recordedVideo && (
        <div className="flex items-center justify-center gap-2 text-success">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Video recorded successfully</span>
        </div>
      )}
    </div>
  );
};

export default VideoRecordStep;
