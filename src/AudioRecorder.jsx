import React, { useState, useEffect } from "react";

const AudioRecorder = () => {
  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);

  useEffect(async () => {
    let stream;
    try {
      // We will implement this later.
      stream = await getAudioStream();
    } catch (error) {
      // Users browser doesn't support audio.
      // Add your handler here.
      console.log(error);
    }
  }, [third]);

  if (!stream) {
    return null;
  }

  function startRecord() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const recorder = new RecorderJS(audioContext);
    recorder.init(stream);
    this.setState(
      {
        recorder,
        recording: true,
      },
      () => {
        recorder.start();
      }
    );
  }

  return (
    <button
      onClick={() => {
        recording ? stream.stopRecord() : stream.startRecord();
      }}
    >
      {recording ? "Stop Recording" : "Start Recording"}
    </button>
  );
};

export default AudioRecorder;
