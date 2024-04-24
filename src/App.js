import React, { useState, useEffect } from "react";
import * as AWS from "aws-sdk";
import { exportBuffer } from "./utils/audio";

const App = () => {
  const [audioURL, setAudioURL] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  function postToLex(arrayBuffer) {
    AWS.config.update({
      region: "us-east-1",
      credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: "us-east-1:dbc51cf3-6927-4e0f-a569-0f054362d329",
      }),
    });

    var lexruntime = new AWS.LexRuntime();

    // Example usage of lexruntime to post content
    var params = {
      botAlias: "$LATEST",
      botName: "BookTrip",
      contentType: "audio/x-l16; sample-rate=16000",
      userId: "testing",
      accept: "audio/mpeg",
      inputStream: arrayBuffer,
    };

    lexruntime.postContent(params, function (err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else {
        const lexAudioStream = data.audioStream;
        const responseBlob = new Blob([lexAudioStream], { type: "audio/mpeg" });
        const objectUrl = window.URL.createObjectURL(responseBlob);
        setAudioURL(objectUrl);
      }
    });
  }

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
          try {
            const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
            const audioUrl = URL.createObjectURL(audioBlob);
            const buffer = await audioBlob.arrayBuffer();
            console.log("RAW BUFFER :::: ", buffer);
            const encodedBuffer = exportBuffer(buffer);
            console.log("ENCODED WAV :::: ", encodedBuffer);
            postToLex(encodedBuffer);
            // setAudioURL(audioUrl);
            audioChunks = [];
          } catch (error) {
            console.error("Error while converting blob to buffer", error);
          }
        };

        setMediaRecorder(recorder);
      } catch (err) {
        console.error("Error accessing the microphone", err);
      }
    };

    getMicrophonePermissions();

    // Cleanup function to stop the media stream
    return () => {
      mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startRecording = () => {
    setAudioURL(null);
    if (mediaRecorder) {
      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      {audioURL && <audio src={audioURL} controls />}
    </div>
  );
};

export default App;
