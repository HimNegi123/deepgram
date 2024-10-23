import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";

const App = () => {
  const [transcription, setTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const microphoneRef = useRef(null);
  const socketRef = useRef(null);

  // Function to get microphone access
  const getMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return new MediaRecorder(stream, { mimeType: "audio/webm" });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      throw error;
    }
  };

  // Function to open the microphone and start streaming data
  const openMicrophone = async (microphone, socket) => {
    return new Promise((resolve) => {
      microphone.onstart = () => {
        console.log("Microphone opened");
        document.body.classList.add("recording");
        resolve();
      };

      microphone.ondataavailable = (event) => {
        console.log("Microphone data received");
        if (event.data.size > 0 && socket.connected) {
          socket.emit("sendAudio", event.data);
        }
      };

      microphone.start(1000); // Send audio chunks every 1 second
    });
  };

  // Function to close the microphone
  const closeMicrophone = async (microphone) => {
    microphone.stop();
    document.body.classList.remove("recording");
  };

  // Handle starting and stopping of microphone and Socket.IO connection
  const handleRecording = async () => {
    if (!isRecording) {
      try {
        const microphone = await getMicrophone();
        microphoneRef.current = microphone;

        await openMicrophone(microphone, socketRef.current);
        setIsRecording(true);
      } catch (error) {
        console.error("Error starting recording:", error);
      }
    } else {
      if (microphoneRef.current) {
        await closeMicrophone(microphoneRef.current);
        microphoneRef.current = null;
        setIsRecording(false);
      }
    }
  };

  useEffect(() => {
    const token='ya29.a0AcM612xjAsoKNB_K6rCTBnD5MFgSjpe69mjw27tHHRyyL_642mAQmS9lT2A2MOvYF5sIh1qztqmZ2fdgfCLK9-WvPQDwrjDHAdsUOlQQOdEHqEF1FZWqxyUh0XM8wyz3PbH0mnQdu_zvtUgNr3Os7oWSh9TgBgIoPC6P53W4fqb5Gi9_VeM1AmzSOrEMf5R3keddn4nhUooWHz4NblTV0Wz00aFhm5Y8NLhHC-sYGbkvmTU1Q1v1LT7a3vbqpeF_jermCT7QGjsSdFzckvCEgPhfIe-EW0HvRrGCQazeBx9YZE8Tws1Prsnh6e8P9Hb1tfxDUpjgGQYbQP_V--GFSDlr7ltq7oWu_tOqS-0GsiVahu7DYmCFum0YKNyGTPX4MuYugkL69SHm-_Ek2IUEe8MjW44YtNQR05UvmwaCgYKAd0SARESFQHGX2MicDSn8-SSIfDiHky-sDtZdQ0429'
    // Set up Socket.IO connection to localhost when component mounts
    const socket = io('https://backend-483783451101.us-central1.run.app/', {
      extraHeaders: {
          Authorization: `Bearer ${token}`
      }
  });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
    });

    socket.on("transcript", (data) => {
      if (data && data.channel && data.channel.alternatives[0].transcript) {
        setTranscription((prev) => prev + " " + data.channel.alternatives[0].transcript);
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Live Transcription with Deepgram</h1>
      <button onClick={handleRecording}>
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <div style={{ marginTop: "20px", whiteSpace: "pre-wrap" }}>
        <h3>Transcription:</h3>
        <p>{transcription}</p>
      </div>
    </div>
  );
};

export default App;