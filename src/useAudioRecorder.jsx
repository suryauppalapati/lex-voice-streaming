import { useState, useEffect } from "react";

const useAudioRecorder = ({ onAudioData, onError }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  useEffect(() => {
    const initMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
          if (onAudioData && event.data.size > 0) {
            onAudioData(event.data);
          }
        };

        recorder.onerror = (event) => {
          if (onError) {
            onError(event.error || new Error("Unknown MediaRecorder error"));
          }
        };

        setMediaRecorder(recorder);
      } catch (err) {
        console.error("Error accessing the microphone:", err);
        if (onError) {
          onError(err);
        }
      }
    };

    initMediaRecorder();

    return () => {
      mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
    };
  }, [onAudioData, onError]);

  const startRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "inactive") {
      mediaRecorder.start(100); // Capture audio in slices of 100ms
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
};

export default useAudioRecorder;
