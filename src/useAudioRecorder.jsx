import { useState, useEffect } from "react";

const useAudioRecorder = ({ onAudioData, onError }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [blob, setBlob] = useState(null);

  useEffect(() => {
    const initMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
          // if (onAudioData && event.data.size > 0) {
          //   onAudioData(event.data);
          // }
          audioChunks.push(event.data);
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          console.log("audioBlob", audioBlob);
          onAudioData(audioBlob);
          setBlob(audioBlob);
          // const audioUrl = URL.createObjectURL(audioBlob);
          // setAudioURL(audioUrl);
          audioChunks = [];
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

  const startRecording = async () => {
    if (mediaRecorder && mediaRecorder.state === "inactive") {
      await mediaRecorder.start(); // Capture audio in slices of 100ms
      setIsRecording(true);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      await mediaRecorder.stop();
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
