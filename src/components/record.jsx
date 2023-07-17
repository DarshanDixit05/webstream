import React, { useEffect, useRef, useState } from 'react';
import { useReactMediaRecorder } from "react-media-recorder";
import io from 'socket.io-client';

const VideoRecorder = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [download, setDownload] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const getMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera and microphone:', error);
      }
    };

    getMediaStream();
    
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
    socketRef.current.emit('mediaBlobUrl', blobUrl);
  };

  const startRecording = () => {
    const stream = canvasRef.current.captureStream();
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });

    mediaRecorderRef.current.addEventListener('dataavailable', handleDataAvailable);
    mediaRecorderRef.current.start();

    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
    setDownload(true);

    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    setRecordedVideo(URL.createObjectURL(blob));
  };

  const handleDataAvailable = (event) => {
    if (event.data.size > 0) {
      chunksRef.current.push(event.data);
    }
  };

  const addOverlays = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const { videoWidth, videoHeight } = video;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    context.clearRect(0, 0, videoWidth, videoHeight);
    context.drawImage(video, 0, 0, videoWidth, videoHeight);

    context.font = '20px Arial';
    context.fillStyle = 'red';
    context.fillText('Its WAVE', 20, 40);

    if (recording) {
      requestAnimationFrame(addOverlays);
    }
  };

  const handleTimeUpdate = () => {
    if (recording) {
      addOverlays();
    }
  };

  return (
    <div className="video-recorder">
      <video ref={videoRef} autoPlay muted onTimeUpdate={handleTimeUpdate} />
      <canvas ref={canvasRef} />
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
      {/* Add other controls and UI elements */}
      {recordedVideo && <video src={recordedVideo} controls />}
      {download === true && (
          <div>
            <p>Recording stopped. You can download the recording:</p>
              <a href={recordedVideo} onClick={sendMediaBlobUrlToBackend(recordedVideo)} download="recording.webm">
                Download
              </a>
          </div>
      )}
    </div>
  );
};

export default VideoRecorder;