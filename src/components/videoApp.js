import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useParams, useLocation } from 'react-router-dom';

const VideoApp = () => {
    const { userId } = useParams();
    const location = useLocation(); // Get the userId from the URL
    const socket = useRef(null);
    const peer = useRef(new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }
        ]
    }));
    const [iceCandidatesQueue, setIceCandidatesQueue] = useState([]);

    useEffect(() => {
        console.log('Initializing socket and peer connection');
        socket.current = io('http://localhost:8000');

        peer.current.ontrack = ({ streams: [stream] }) => {
            console.log('Received remote track');
            const remoteVideo = document.getElementById('remote-video');
            remoteVideo.srcObject = stream;
            remoteVideo.onloadedmetadata = () => {
                remoteVideo.play().catch(error => {
                    console.error('Error playing remote video:', error);
                });
            };
        };

        peer.current.onicecandidate = event => {
            if (event.candidate) {
                console.log('Sending ICE candidate:', event.candidate);
                socket.current.emit('ice-candidate', { candidate: event.candidate, to: userId });
            }
        };

        peer.current.oniceconnectionstatechange = () => {
            console.log('ICE connection state change:', peer.current.iceConnectionState);
            if (peer.current.iceConnectionState === 'failed') {
                console.error('ICE connection failed. Restarting ICE...');
                peer.current.restartIce();
            }
        };

        peer.current.onicegatheringstatechange = () => {
            console.log('ICE gathering state change:', peer.current.iceGatheringState);
        };

        peer.current.onicecandidateerror = event => {
            console.error('ICE candidate error:', event);
        };


        socket.current.on('connect', () => {
            console.log('Socket connected:', socket.current.connected);
            socket.current.emit('setUserId', JSON.parse(localStorage.getItem('userdata')).id);
        });

        socket.current.on('incomming:call', async ({ fromUserId, offer }) => {
            console.log('Incoming call from:', fromUserId, 'with offer:', offer);
            await handleIncomingOffer(fromUserId, offer);
        });

        socket.current.on('incomming:answere', async ({ offer }) => {
            // debugger
            console.log('Received answer:', offer);
            await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('Remote description set with answer');
            processIceCandidatesQueue();
        });

        socket.current.on('ice-candidate', async ({ candidate }) => {
            console.log('Received ICE candidate:', candidate);
            if (candidate) {
                try {
                    // debugger
                    //await peer.current.addIceCandidate(new RTCIceCandidate(candidate));
                    if (peer.current.remoteDescription) {
                        await peer.current.addIceCandidate(new RTCIceCandidate(candidate));
                        console.log('Added ICE candidate:', candidate);
                    } else {
                        console.log('Remote description not set, queuing ICE candidate:', candidate);
                        setIceCandidatesQueue(prevQueue => [...prevQueue, candidate]);
                    }
                } catch (error) {
                    console.error('Error adding received ICE candidate', error);
                }
            }
        });

        if (location.state && location.state.offer) {
            console.log('Handling incoming offer from state:', location.state.offer);
            handleIncomingOffer(userId, location.state.offer);
        } else {
            getUserMedia().then(() => createCall(userId));
        }

        return () => {
            console.log('Closing peer connection and disconnecting socket');
            peer.current.close();
            socket.current.disconnect();
        };
    }, [userId]);

    const getUserMedia = async () => {
        try {
            const userMedia = await navigator.mediaDevices.getUserMedia({ video: true });
            console.log('User media obtained:', userMedia);

            const localVideo = document.getElementById('local-video');
            localVideo.srcObject = userMedia;
            localVideo.onloadedmetadata = () => {
                localVideo.play().catch(error => {
                    console.error('Error playing local video:', error);
                });
            };

            return userMedia;
        } catch (error) {
            console.error('Error getting user media:', error);
        }
    };

    const addLocalTracksToPeer = async () => {
        const userMedia = await getUserMedia();
        if (userMedia) {
            userMedia.getTracks().forEach(track => {
                console.log('Adding track to peer connection:', track);
                peer.current.addTrack(track, userMedia);
            });
        }
    };

    const createCall = async (to) => {
        try {
            console.log('Creating call to:', to);
            await addLocalTracksToPeer();
            const localOffer = await peer.current.createOffer();
            await peer.current.setLocalDescription(localOffer);
            console.log('Local description set with offer:', localOffer);
            socket.current.emit('outgoing:call', { fromOffer: localOffer, to, fromUserId: JSON.parse(localStorage.getItem('userdata')).id });
        } catch (error) {
            console.error('Error creating call:', error);
        }
    };

    const handleIncomingOffer = async (fromUserId, offer) => {
        try {
            console.log('Handling incoming offer from:', fromUserId, 'with offer:', offer);
            await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
            await addLocalTracksToPeer();
            const answer = await peer.current.createAnswer();
            await peer.current.setLocalDescription(answer);
            console.log('Local description set with answer:', answer);
            socket.current.emit('call:accepted', { answer, to: fromUserId });
            processIceCandidatesQueue();
        } catch (error) {
            console.error('Error handling incoming offer:', error);
        }
    };

    const processIceCandidatesQueue = async () => {
        console.log('Processing ICE candidates queue:', iceCandidatesQueue);
        while (iceCandidatesQueue.length > 0) {
            const candidate = iceCandidatesQueue.shift();
            try {
                if(candidate) await peer.current.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('Added queued ICE candidate:', candidate);
            } catch (error) {
                console.error('Error adding queued ICE candidate', error);
            }
        }
    };

    useEffect(() => {   
        if (iceCandidatesQueue.length > 0) {
            processIceCandidatesQueue()
        }
    }, [iceCandidatesQueue])
    console.log('main iceCandidatesQueue', iceCandidatesQueue);
    return (
        <div>
            <h3>Video Call with {userId}</h3>
            <video id="local-video" autoPlay playsInline muted></video>
            <video id="remote-video" autoPlay playsInline></video>
            <p id="status"></p>
        </div>
    );
};

export default VideoApp;

