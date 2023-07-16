import React, { useEffect, useRef } from 'react';
import { useReactMediaRecorder } from "react-media-recorder";
import io from 'socket.io-client';

function Record() {
  const { status, startRecording, stopRecording, mediaBlobUrl } =
  useReactMediaRecorder({ video: true });

  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:3001');
    socketRef.current.on('connect', () => {
      console.log('Socket.IO connection established');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket.IO connection closed');
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const sendMediaBlobUrlToBackend = (blobUrl) => {
    // Emit an event 
    socketRef.current.emit('mediaBlobUrl', blobUrl);
  };

  return (
    <>
      <div>
        <p>{status}</p>
        <button onClick={startRecording}>Start Recording</button>
        <button onClick={stopRecording}>Stop Recording</button>
        <video src={mediaBlobUrl} controls  />
      </div>
      {status === 'stopped' && (
        <div>
          <p>Recording stopped. You can download the recording:</p>
            <a href={mediaBlobUrl} onClick={sendMediaBlobUrlToBackend(mediaBlobUrl)} download="recording.webm">
              Download
            </a>
        </div>
      )}
    </>
  );
}
  

export default Record