// import React, { useEffect, useRef, useState } from 'react';
// import io from 'socket.io-client';
// import { useParams } from 'react-router-dom';

// const VideoApp = () => {
//     const { userId } = useParams();
//     const socket = useRef(io('http://localhost:8000')); // Ref for socket.io instance
//     const peer = useRef(null); // Ref for RTCPeerConnection instance
//     const [users, setUsers] = useState(new Set()); 

//     useEffect(() => {

//         // Initialize RTCPeerConnection
//         peer.current = new RTCPeerConnection({
//             iceServers: [
//                 {
//                     urls: "stun:stun.stunprotocol.org"
//                 }
//             ]
//         });

//         // Set event listeners for RTCPeerConnection
//         peer.current.ontrack = handleTrack;
//         peer.current.onicecandidate = handleIceCandidate;

//         peer.ontrack = async ({ streams: [stream] }) => {
//             const status = document.getElementById('status');
//             status.innerText = 'Incoming Stream';

//             const video = document.getElementById('remote-video');
//             if (!video.srcObject) {
//                 video.srcObject = stream;
//                 video.onloadedmetadata = () => {
//                     video.play().catch(error => {
//                         console.error('Error playing local video:', error);
//                     });
//                 };
//             } else {
//                 // You can choose to handle this scenario differently
//                 console.warn('Video element already has srcObject set.');
//             }
//         };

//         socket.current.on('incomming:answere', async data => {
//             const status = document.getElementById('status');
//             status.innerText = 'incomming:answere';

//             const { offer } = data;
//             // debugger                     
//             if (!peer.current) {
//                 console.error('PeerConnection does not exist.');
//                 return;
//             }
//             // Check if peer connection is in the correct state

//             if (peer.current.signalingState !== 'have-local-offer') {
//                 console.warn('PeerConnection is not in the correct state to handle incoming call.');
//                 return;
//             }

//             try {
//                 await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
//             } catch (error) {
//                 console.log('error in setRemoteDescription', error);
//                 // await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
//             }
//             // await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
//         });

//         // Listen for socket connection
//         socket.current.on('connect', () => {
//             console.log('Socket connected:', socket.current.connected);
//             // Now the socket connection is established, you can emit events or perform other actions
//         });

//         // Attempt to connect socket
//         socket.current.connect();

//         // Get user media on component mount
//         getUserMedia();

//         createCall(userId);

//         // Cleanup function on component unmount
//         return () => {
//             peer.current.close();
//         };
//     }, []);

//     // Function to handle incoming tracks
//     const handleTrack = async ({ streams }) => {
//         const remoteVideo = document.getElementById('remote-video');
//         if (remoteVideo) {
//             remoteVideo.srcObject = streams[0];
//             remoteVideo.onloadedmetadata = () => {
//                 remoteVideo.play().catch(error => {
//                     console.error('Error playing local video:', error);
//                 });
//             };

//             const mySteam = await navigator.mediaDevices.getUserMedia({
//                 video: true,
//             });

//             for (const track of mySteam.getTracks()) {
//                 peer.current.addTrack(track, mySteam);
//             }

//         }
//     };

//     // Function to handle ICE candidates
//     const handleIceCandidate = (event) => {
//         if (event.candidate) {
//             // Send ICE candidate to server
//             socket.current.emit('ice-candidate', { candidate: event.candidate });
//         }
//     };

//     // Function to create a call
//     const createCall = async (to) => {
//         try {
//             console.log('create call');
//             // Create local offer
//             const localOffer = await peer.current.createOffer();
//             await peer.current.setLocalDescription(localOffer);

//             // Send local offer to server
//             console.log('Send local offer to server', { fromOffer: localOffer, to });
//             console.log('Socket connected:', socket.current.connected);
//             socket.current.emit('outgoing:call', { fromOffer: localOffer, to });
//             console.log('Send local offer to server done');
//         } catch (error) {
//             console.error('Error creating call:', error);
//         }
//     };

//     // Function to handle incoming call
//     const handleIncomingCall = async (data) => {
//         try {
//             console.log('incoming call', data);
//             const status = document.getElementById('status');
//             status.innerText = 'incomming:call';

//             const { from, offer } = data;

//             // Set remote description
//             await peer.current.setRemoteDescription(new RTCSessionDescription(offer));

//             // Create answer
//             const answereOffer = await peer.current.createAnswer();
//             // await peer.current.setLocalDescription(answereOffer);
//             await peer.current.setLocalDescription(new RTCSessionDescription(answereOffer));

//             // Send answer to server    
//             socket.current.emit('call:accepted', { answere: answereOffer, to: from });
//             const userMedia = await navigator.mediaDevices.getUserMedia({ video: true });
//             userMedia.getTracks().forEach(track => {
//                 peer.current.addTrack(track, userMedia);
//             });
//         } catch (error) {
//             console.error('Error handling incoming call:', error);
//         }
//     };

//     // Function to handle user media
//     const getUserMedia = async () => {
//         try {
//             const userMedia = await navigator.mediaDevices.getUserMedia({
//                 video: true,
//             });

//             const localVideo = document.getElementById('local-video');
//             if (localVideo) {
//                 localVideo.srcObject = userMedia;
//                 localVideo.onloadedmetadata = () => {
//                     localVideo.play().catch(error => {
//                         console.error('Error playing local video:', error);
//                     });
//                 };
//             }

//             // Add user media tracks to peer connection
//             userMedia.getTracks().forEach(track => {
//                 peer.current.addTrack(track, userMedia);
//             });
//         } catch (error) {
//             console.error('Error getting user media:', error);
//         }
//     };

//     // Function to fetch and update users
//     const getAndUpdateUsers = async () => {
//         try {
//             const response = await fetch('http://localhost:8000/users');
//             const jsonResponse = await response.json();

//             // Update users list
//             const usersDiv = document.getElementById('users');
//             usersDiv.innerHTML = '';
//             jsonResponse.forEach(user => {
//                 const btn = document.createElement('button');
//                 btn.id = user[0];
//                 btn.textContent = user[0];
//                 btn.onclick = () => createCall(user[0]);
//                 usersDiv.appendChild(btn);
//             });
//         } catch (error) {
//             console.error('Error fetching users:', error);
//         }
//     };

//     // Initialize socket event listeners
//     useEffect(() => {
//         socket.current.on('users:joined', (id) => {
//             const usersDiv = document.getElementById('users');
//             const btn = document.createElement('button');
//             btn.id = id;
//             btn.textContent = id;
//             btn.onclick = () => createCall(id);
//             usersDiv.appendChild(btn);
//         });

//         socket.current.on('incomming:call', handleIncomingCall);

//         socket.current.on('user:disconnect', id => {
//             const userButton = document.getElementById(id);
//             if (userButton) {
//                 userButton.remove();
//             }
//         });

//         socket.current.on('hello', ({ id }) => {
//             const myIdSpan = document.getElementById('myId');
//             if (myIdSpan) {
//                 myIdSpan.innerText = id;
//             }
//         });

//         getAndUpdateUsers();

//         return () => {
//             socket.current.disconnect();
//         };
//     }, []);

//     return (
//         <div>
//             <h3>Your Id: <span id="myId"></span></h3>
//             <h3>Online Users (click to connect)</h3>
//             <div id="users"></div>
//             <video id="local-video" autoPlay playsInline muted></video>
//             <video id="remote-video" autoPlay playsInline></video>
//             <p id="status"></p>
//         </div>
//     );
// };

// export default VideoApp;




import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useParams, useLocation } from 'react-router-dom';

const VideoApp = () => {
    const { userId } = useParams();
    const location = useLocation(); // Get the userId from the URL
    const socket = useRef(null);
    const peer = useRef(null);

    useEffect(() => {
        socket.current = io('http://localhost:8000');
        peer.current = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.stunprotocol.org" }
            ]
        });

        peer.current.ontrack = handleTrack;
        peer.current.onicecandidate = handleIceCandidate;

        socket.current.on('connect', () => {
            console.log('Socket connected:', socket.current.connected);
        });

        peer.ontrack = async ({ streams: [stream] }) => {
            const status = document.getElementById('status');
            status.innerText = 'Incoming Stream';

            const video = document.getElementById('remote-video');
            if (!video.srcObject) {
                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    video.play().catch(error => {
                        console.error('Error playing local video:', error);
                    });
                };
            } else {
                // You can choose to handle this scenario differently
                console.warn('Video element already has srcObject set.');
            }
        };
        socket.current.on('incomming:call', handleIncomingCall);
        socket.current.emit('setUserId', JSON.parse(localStorage.getItem('userdata')).id);
        socket.current.on('incomming:answere', async data => {
            debugger
            const status = document.getElementById('status');
            status.innerText = 'incomming:answere';

            const { offer } = data;

            // if (peer.current.signalingState !== 'stable') {
            //     console.warn('PeerConnection is not in the correct state to handle incoming call.');
            //     peer.current.addEventListener('signalingstatechange', async function onStableState() {
            //         if (peer.current.signalingState === 'stable') {
            //             peer.current.removeEventListener('signalingstatechange', onStableState);
            //             await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
            //         }
            //     });
            //     return;
            // }

            try {
                await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
            } catch (error) {
                console.log('Error in incomming:answere', error);
            }
        });

        socket.current.on('ice-candidate', async ({ candidate }) => {
            try {
                await peer.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error('Error adding received ICE candidate', error);
            }
        });

        socket.current.connect();
        // If the component was navigated to with a state, it means the user is accepting a call
        if (location.state && location.state.offer) {
            handleIncomingOffer(location.state.offer);
        } else {
            // If no state is passed, the user is initiating a call
            getUserMedia().then(() => createCall(userId));
        }
        return () => {
            peer.current.close();
            socket.current.disconnect();
        };
    }, [userId]);

    const handleTrack = ({ streams }) => {
        const remoteVideo = document.getElementById('remote-video');
        if (remoteVideo) {
            remoteVideo.srcObject = streams[0];
            remoteVideo.onloadedmetadata = () => {
                remoteVideo.play().catch(error => {
                    console.error('Error playing remote video:', error);
                });
            };
        }
    };

    const handleIceCandidate = (event) => {
        if (event.candidate) {
            socket.current.emit('ice-candidate', { candidate: event.candidate });
        }
    };

    const createCall = async (to) => {
        try {
            debugger
            const localOffer = await peer.current.createOffer();
            await peer.current.setLocalDescription(localOffer);
            socket.current.emit('outgoing:call', { fromOffer: localOffer, to, fromUserId: JSON.parse(localStorage.getItem('userdata')).id });
        } catch (error) {
            console.error('Error creating call:', error);
        }
    };

    const handleIncomingCall = async (data) => {
        try {
            debugger

            console.log('incomming:called');
            const status = document.getElementById('status');
            status.innerText = 'incomming:call';

            const { from, offer } = data;

            if (peer.current.signalingState !== 'stable') {
                console.warn('PeerConnection is not in the correct state to handle incoming call.');
                peer.current.addEventListener('signalingstatechange', async function onStableState() {
                    if (peer.current.signalingState === 'stable') {
                        peer.current.removeEventListener('signalingstatechange', onStableState);
                        await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
                        await createAnswer(from);
                    }
                });
                return;
            }

            await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
            await createAnswer(from);
        } catch (error) {
            console.error('Error handling incoming call:', error);
        }
    };

    const createAnswer = async (from) => {
        const answerOffer = await peer.current.createAnswer();
        await peer.current.setLocalDescription(new RTCSessionDescription(answerOffer));
        socket.current.emit('call:accepted', { answer: answerOffer, to: from });

        const userMedia = await navigator.mediaDevices.getUserMedia({ video: true });
        userMedia.getTracks().forEach(track => {
            peer.current.addTrack(track, userMedia);
        });
    };

    const handleIncomingOffer = async (offer) => {
        debugger
        await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.current.createAnswer();
        await peer.current.setLocalDescription(answer);
        socket.current.emit('call:accepted', { answer, to: userId });
    };

    const getUserMedia = async () => {
        try {
            const userMedia = await navigator.mediaDevices.getUserMedia({ video: true });

            const localVideo = document.getElementById('local-video');
            if (localVideo) {
                localVideo.srcObject = userMedia;
                localVideo.onloadedmetadata = () => {
                    localVideo.play().catch(error => {
                        console.error('Error playing local video:', error);
                    });
                };
            }

            userMedia.getTracks().forEach(track => {
                peer.current.addTrack(track, userMedia);
            });
        } catch (error) {
            console.error('Error getting user media:', error);
        }
    };

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
