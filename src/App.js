import useAudioRecorder from "./useAudioRecorder";
import * as AWS from "aws-sdk";
import { LexRuntimeServiceClient, PostContentCommand } from "@aws-sdk/client-lex-runtime-service";

function App() {
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-1:dbc51cf3-6927-4e0f-a569-0f054362d329",
  });
  AWS.config.region = "us-east-1";

  const lexConfig = {
    apiVersion: "2016-11-28",
    region: AWS.config.region,
  };

  const input = {
    // PostContentRequest
    botName: "BookTrip", // required
    botAlias: "production", // required
    userId: "userId", // required
    contentType: "audio/l16; rate=16000; channels=1", // required
    accept: "audio/pcm",
    inputStream: "MULTIPLE_TYPES_ACCEPTED", // see \@smithy/types -> StreamingBlobPayloadInputTypes // required
  };

  const lexClient = new LexRuntimeServiceClient(lexConfig);

  const handleAudioData = async (data) => {
    console.log("Streaming data:", data);
    const command = new PostContentCommand(input);
    const response = await client.send(command);
    console.log("response");
  };

  const handleError = (error) => {
    console.error("Error from recorder:", error);
  };

  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    onAudioData: handleAudioData,
    onError: handleError,
  });

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      {/* {audioURL && <audio src={audioURL} controls />} */}
    </div>
  );
}

export default App;
