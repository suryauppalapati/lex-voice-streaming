import React, { useState, useEffect, useRef } from "react";
import * as AWS from "aws-sdk";
import { exportBuffer, convertToFloat32Array } from "./utils/audio";

const App = () => {
  const [audioURL, setAudioURL] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [dialogState, setDialogState] = useState(null);
  const audioRef = useRef(null); // Ref to attach to the audio element for direct DOM manipulation (audio-tag)

  // Function to send recorded audio to AWS Lex and handle the response
  function postToLex(arrayBuffer) {
    AWS.config.update({
      region: "us-east-1",
      credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: "us-east-1:dbc51cf3-6927-4e0f-a569-0f054362d329",
      }),
    });

    var lexruntime = new AWS.LexRuntime();
    var params = {
      botAlias: "$LATEST",
      botName: "BookTrip",
      contentType: "audio/x-l16; sample-rate=16000",
      userId: "testing",
      accept: "audio/mpeg",
      inputStream: arrayBuffer,
    };

    // Post audio content to Lex and process the response
    lexruntime.postContent(params, function (err, data) {
      if (err) console.log(err, err.stack);
      else {
        console.log("Lex Response:::", data);
        const lexAudioStream = data.audioStream;
        const responseBlob = new Blob([lexAudioStream], { type: "audio/mpeg" });
        const objectUrl = window.URL.createObjectURL(responseBlob);
        setDialogState(data.dialogState);
        setAudioURL(objectUrl);
      }
    });
  }

  // Effect to obtain microphone permissions and set up the media recorder
  useEffect(() => {
    const getMicrophonePermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        let audioChunks = [];

        recorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          const buffer = await audioBlob.arrayBuffer();
          const float32Buffer = convertToFloat32Array(buffer);
          const encodedBuffer = exportBuffer(float32Buffer.buffer);
          postToLex(encodedBuffer);
          audioChunks = [];
        };

        setMediaRecorder(recorder);
      } catch (err) {
        console.error("Error accessing the microphone", err);
      }
    };

    getMicrophonePermissions();

    return () => {
      // Clean up: stop any media tracks when the component unmounts
      mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Effect to handle automatic playback and starting new recording once playback finishes
  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl) {
      audioEl.onended = () => {
        console.log("Audio playback finished, starting new recording...");
        startRecording();
      };

      // Trigger play if autoplay fails due to browser incompatiability
      if (audioURL) {
        audioEl.play().catch((error) => {
          console.error("Playback failed:", error);
        });
      }
    }

    return () => {
      // Clean up: remove the event listener when the component re-renders or unmounts
      if (audioEl) {
        audioEl.onended = null;
      }
    };
  }, [audioURL]);

  // Start recording audio
  const startRecording = () => {
    setAudioURL(null);
    setDialogState(null);
    if (mediaRecorder && dialogState !== "Failed") {
      mediaRecorder.start();
      setIsRecording(true);

      //Three seconds window for user to interact with bot
      setTimeout(() => {
        console.log("Stopping recording");
        stopRecording();
        setIsRecording(false);
      }, 3000);
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Render the component UI
  return (
    <div style={{ margin: "auto", padding: "20%" }}>
      <div style={{ display: "flex", columnGap: "1rem" }}>
        <button onClick={startRecording} disabled={isRecording}>
          Start Recording
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
      </div>
      <br />
      {audioURL && <audio ref={audioRef} src={audioURL} controls autoPlay />}
    </div>
  );
};

export default App;
