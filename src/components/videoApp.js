import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VideoApp = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation(); // Get the userId from the URL
    const socket = useRef(null);
    const peer = useRef(new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }
        ]
    }));
    const [iceCandidatesQueue, setIceCandidatesQueue] = useState([]);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const fetchUserName = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/get-username?userId=${userId}`);
                setUserName(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };
        fetchUserName();
    }, [])

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

        socket.current.on('call:disconnected', ({ from }) => {
            console.log('Call disconnected by user:', from);
            peer.current.close();
            
            // Stop remote video stream
            const remoteVideo = document.getElementById('remote-video');
            if (remoteVideo && remoteVideo.srcObject) {
                remoteVideo.srcObject.getTracks().forEach(track => track.stop());
            }
    
            // Optionally navigate back to chat page
            navigate('/chat');
        });

        socket.current.on('incomming:call', async ({ fromUserId, offer }) => {
            console.log('Incoming call from:', fromUserId, 'with offer:', offer);
            await handleIncomingOffer(fromUserId, offer);
        });

        socket.current.on('incomming:answere', async ({ offer }) => {
            console.log('Received answer:', offer);
            await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('Remote description set with answer');
            processIceCandidatesQueue();
        });

        socket.current.on('ice-candidate', async ({ candidate }) => {
            console.log('Received ICE candidate:', candidate);
            if (candidate) {
                try {
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
                if (candidate) await peer.current.addIceCandidate(new RTCIceCandidate(candidate));
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


    // Function to disconnect the call and navigate back to chat page
    const disconnectCall = () => {
        console.log('Disconnecting call');

        // Inform the other user that the call is disconnected
        socket.current.emit('call:disconnect', { from: JSON.parse(localStorage.getItem('userdata')).id, to: userId });


        peer.current.close(); // Close peer connection
        socket.current.disconnect(); // Disconnect socket

        // Stop local video stream
        const localVideo = document.getElementById('local-video');
        if (localVideo && localVideo.srcObject) {
            localVideo.srcObject.getTracks().forEach(track => track.stop());
        }

        // Navigate back to chat page
        navigate('/chat');
    };

    console.log('main iceCandidatesQueue', iceCandidatesQueue);
    console.log('userName', userName);
    return (
        <>
            <section className='VideoOuter'>
                <div className='incomingVideo'>
                    <div className='container'>
                        <div className='row'>
                            <div className='col-12 position-relative'>
                                <div className='videoInner position-relative'>
                                    <video id="remote-video" autoPlay playsInline></video>
                                    <div className='callerNamer'>
                                        <h3>Video Call with {userName}</h3>
                                    </div>
                                </div>

                                <div className='outgoingVideo'>
                                    <video id="local-video" autoPlay playsInline muted></video>
                                    <div className='incomingCallerName'>
                                        <h4>Me</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='callMenu mt-2 pt-1'>
                    <div className='container'>
                        <div className='row'>
                            <div className='col-12 d-flex align-items-center justify-content-center'>

                                <div onClick={disconnectCall} class="endCall callButton">
                                    <svg viewBox="0 0 24 24" fill="none"
                                        width="22px" height="22px"
                                        xmlns="http://www.w3.org/2000/svg"><g
                                            id="SVGRepo_bgCarrier"
                                            stroke-width="0"></g><g
                                                id="SVGRepo_tracerCarrier"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"></g><g
                                                    id="SVGRepo_iconCarrier">
                                            <path
                                                d="M3 5.5C3 14.0604 9.93959 21 18.5 21C18.8862 21 19.2691 20.9859 19.6483 20.9581C20.0834 20.9262 20.3009 20.9103 20.499 20.7963C20.663 20.7019 20.8185 20.5345 20.9007 20.364C21 20.1582 21 19.9181 21 19.438V16.6207C21 16.2169 21 16.015 20.9335 15.842C20.8749 15.6891 20.7795 15.553 20.6559 15.4456C20.516 15.324 20.3262 15.255 19.9468 15.117L16.74 13.9509C16.2985 13.7904 16.0777 13.7101 15.8683 13.7237C15.6836 13.7357 15.5059 13.7988 15.3549 13.9058C15.1837 14.0271 15.0629 14.2285 14.8212 14.6314L14 16C11.3501 14.7999 9.2019 12.6489 8 10L9.36863 9.17882C9.77145 8.93713 9.97286 8.81628 10.0942 8.64506C10.2012 8.49408 10.2643 8.31637 10.2763 8.1317C10.2899 7.92227 10.2096 7.70153 10.0491 7.26005L8.88299 4.05321C8.745 3.67376 8.67601 3.48403 8.55442 3.3441C8.44701 3.22049 8.31089 3.12515 8.15802 3.06645C7.98496 3 7.78308 3 7.37932 3H4.56201C4.08188 3 3.84181 3 3.63598 3.09925C3.4655 3.18146 3.29814 3.33701 3.2037 3.50103C3.08968 3.69907 3.07375 3.91662 3.04189 4.35173C3.01413 4.73086 3 5.11378 3 5.5Z"
                                                stroke="#fff"
                                                stroke-width="2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"></path>
                                        </g></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* <div className='container-fluid'>
                    <div className='row'>
                        <div>
                            <p id="status"></p>
                        </div>
                    </div>
                </div> */}
            </section>
        </>

    );
};

export default VideoApp;

