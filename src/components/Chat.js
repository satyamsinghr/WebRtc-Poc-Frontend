import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const socket = io('http://localhost:8000');

const Chat = ({ user }) => {
    const navigate = useNavigate();
    const [incomingCall, setIncomingCall] = useState(null);
    // const socket = useRef(io('http://localhost:8000'));
    const storedUsers = JSON.parse(localStorage.getItem('userdata'));

    const getCurrentFormattedDate = () => {
        const date = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const currentDate = getCurrentFormattedDate();

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [userData, setUserData] = useState([]);
    const [userName, setUserName] = useState({});

    useEffect(() => {
        socket.on('receiveMessage', (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });
        return () => {
            socket.off('receiveMessage');
        };
    }, []);

    useEffect(() => {
        setUserData(storedUsers);
        if (storedUsers && storedUsers.firstName && storedUsers.lastName) {
            const firstNameFirstLetter = storedUsers.firstName.charAt(0).toUpperCase();
            const lastNameFirstLetter = storedUsers.lastName.charAt(0).toUpperCase();
            const userName = firstNameFirstLetter + lastNameFirstLetter;
            setUserName(userName);
        }

        const fetchUserData = async () => {
            try {
                const response = await axios.get('http://localhost:8000/users');
                setUsers(response.data.filter((x) => x.id !== storedUsers.id));
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };
        fetchUserData();
    }, [user]);

    useEffect(() => {
        socket.emit('setUserId', JSON.parse(localStorage.getItem('userdata')).id);
    }, [userData]);


    const sendMessage = () => {
        if (message.trim()) {
            const messageObject = {
                text: message,
                user: userData.email,
                to: selectedUser ? selectedUser.id : null,
                timestamp: new Date().toISOString(),
            };
            socket.emit('sendMessage', { message: messageObject, to: selectedUser ? selectedUser.id : null });
            setMessages((prevMessages) => [...prevMessages, messageObject]);
            setMessage('');
        }
    };
    useEffect(() => {
        if (users.length > 0 && (!selectedUser || !users.some(u => u.id === selectedUser.id))) {
            setSelectedUser(users[0]);
        }
    }, [users, selectedUser]);

    useEffect(() => {
        socket.emit('setUserId', JSON.parse(localStorage.getItem('userdata')).id);
        const fetchMessages = async () => {
            try {
                const response = await axios.get('http://localhost:8000/messages');
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };
        fetchMessages();
    }, [userData]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleVideoCall = (userId) => {
        navigate(`/video/${userId}`);
    }



    useEffect(() => {
        socket.on('connect', () => {
            console.log('Socket connected:', socket.connected);
        });

        socket.on('incomming:call', (data) => {
            console.log('incoming call from video to chat');
            setIncomingCall(data);
        });

        socket.emit('setUserId', JSON.parse(localStorage.getItem('userdata')).id);
        // return () => {
        //     socket.disconnect();
        // };
    }, []);

    // const handleAcceptCall = () => {
    //     navigate(`/video/${incomingCall.from}`);
    // };

    const handleAcceptCall = () => {
        navigate(`/video/${incomingCall.fromUserId}`, { state: { offer: incomingCall.offer } });
    };

    const handleRejectCall = () => {
        setIncomingCall(null);
    };

    return (
        <section className="messageCEnterOuter">
            <div className="container-fluid px-0">

                {
                    incomingCall && (<div class="incoming_call">
                        <div class="row px-lg-4 px-md-4 mx-0">
                            <div
                                class="col-12 d-flex align-items-center gap-3 justify-content-between">
                                <div
                                    class="user w-100 flex-auto d-flex align-items-center gap-3">
                                    <div class="img">
                                        <p>JT</p>
                                    </div>
                                    <div class="user_info">
                                        <h4 class="text-white">Jess Terff </h4>
                                        <p class="m-0 text-white">Incoming
                                            Call...</p>
                                    </div>
                                </div>
                                <div
                                    class="callButtonOuter w-100 d-flex justify-content-end align-items-center gap-2">
                                    {/* <div class="accept_call callButton">
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
                                    d="M16 10L18.5768 8.45392C19.3699 7.97803 19.7665 7.74009 20.0928 7.77051C20.3773 7.79703 20.6369 7.944 20.806 8.17433C21 8.43848 21 8.90095 21 9.8259V14.1741C21 15.099 21 15.5615 20.806 15.8257C20.6369 16.056 20.3773 16.203 20.0928 16.2295C19.7665 16.2599 19.3699 16.022 18.5768 15.5461L16 14M6.2 18H12.8C13.9201 18 14.4802 18 14.908 17.782C15.2843 17.5903 15.5903 17.2843 15.782 16.908C16 16.4802 16 15.9201 16 14.8V9.2C16 8.0799 16 7.51984 15.782 7.09202C15.5903 6.71569 15.2843 6.40973 14.908 6.21799C14.4802 6 13.9201 6 12.8 6H6.2C5.0799 6 4.51984 6 4.09202 6.21799C3.71569 6.40973 3.40973 6.71569 3.21799 7.09202C3 7.51984 3 8.07989 3 9.2V14.8C3 15.9201 3 16.4802 3.21799 16.908C3.40973 17.2843 3.71569 17.5903 4.09202 17.782C4.51984 18 5.07989 18 6.2 18Z"
                                    stroke="#fff"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"></path>
                            </g></svg>
                    </div> */}
                                    <div onClick={() => handleAcceptCall()}
                                        class="accept_call callButton">
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

                                    <div onClick={handleRejectCall}
                                        class="endCall callButton">
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
                    </div>)
                }





                <div className="row g-3 py-3 px-lg-4 px-md-4 mx-0">
                    <div
                        className="col-lg-5 col-md-5 col-sm-6 col-6 d-flex align-items-center">
                        <div className="heading">
                            <h3 className="m-0">Message Center</h3>
                        </div>
                    </div>
                    <div
                        className="col-lg-7 col-md-7 col-sm-6 col-6 d-flex align-items-center justify-content-end">
                        <div
                            className="d-flex align-items-center gap-3 w-100 justify-content-end">
                            <div className="user_img dropdown position-relative">
                                <div className='img' type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <p>
                                        {userData.firstName && userData.lastName
                                            ? `${userData.firstName.charAt(0).toUpperCase()}${userData.lastName.charAt(0).toUpperCase()}`
                                            : ''}
                                    </p>

                                </div>
                                <div className="userStatus">
                                </div>

                                <ul className="dropdown-menu p-0 header_drop">
                                    <li><a className="dropdown-item" onClick={handleLogout}>Log Out</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="messageTabs">
                </div>
                <div className="messageBody">
                    <div className="row g-3">
                        <div
                            className="col-xl-3 col-lg-4 col-md-12 col-sm-12 col-12">
                            <div className="user_list d-flex flex-column gap-2">
                                <div
                                    className="overflow-auto d-flex flex-column gap-2">
                                    {users.map((u) => (
                                        <div
                                            className={`d-flex user_outer  align-items-center gap-3 justify-content-between ${selectedUser && selectedUser.id === u.id ? 'active' : ''}`}
                                            key={u.id}
                                            onClick={() => setSelectedUser(u)}>
                                            <div className="user  d-flex align-items-center gap-3 col">

                                                <div className="img">
                                                    <p className='m-0'>{u.firstName.charAt(0).toUpperCase()}{u.lastName.charAt(0).toUpperCase()}</p>
                                                </div>
                                                <div className="user_info">
                                                    <h4>{u.firstName + " " + u.lastName} </h4>
                                                    {/* <p class="m-0">Lorem Ipsum is
                                                        simply
                                                        dummy text of the</p> */}
                                                </div>
                                            </div>
                                            {/* <div
                                                class="message_time col d-flex align-items-end flex-column justify-content-end gap-1">
                                                <p>09:14 AM</p>
                                                <div class="unread_count">1</div>
                                            </div> */}
                                        </div>))}
                                </div>
                            </div>
                        </div>
                        <div
                            className="col-xl-9 col-lg-8 col-md-12 col-sm-12 col-12">
                            <div className="chatCard">
                                <div
                                    className="chatHeader d-flex align-items-center gap-3 justify-content-between">
                                    <div
                                        className="user  d-flex align-items-center gap-3 col">
                                        <div className="img">
                                            <p>{selectedUser?.firstName.charAt(0).toUpperCase()}{selectedUser?.lastName.charAt(0).toUpperCase()}</p>
                                        </div>
                                        <div className="user_info">
                                            <h4>{`${selectedUser?.firstName} ${selectedUser?.lastName}`}</h4>
                                            <p
                                                className="m-0 d-flex align-items-center gap-1">
                                                <span className="active_status">

                                                </span>
                                                Online</p>
                                        </div>
                                    </div>
                                    <div
                                        className="header_option d-flex align-items-center gap-3">
                                        <div>
                                            <svg viewBox="0 0 24 24"
                                                width="22px" height="22px"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"><g
                                                    id="SVGRepo_bgCarrier"
                                                    strokeWidth="0"></g><g
                                                        id="SVGRepo_tracerCarrier"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"></g><g
                                                            id="SVGRepo_iconCarrier">
                                                    <path
                                                        d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
                                                        stroke="#fff"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"></path>
                                                </g></svg>
                                        </div>
                                        <div>
                                            <svg viewBox="0 0 24 24" fill="none"
                                                width="22px" height="22px"
                                                xmlns="http://www.w3.org/2000/svg"><g
                                                    id="SVGRepo_bgCarrier"
                                                    strokeWidth="0"></g><g
                                                        id="SVGRepo_tracerCarrier"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"></g><g
                                                            id="SVGRepo_iconCarrier">
                                                    <path
                                                        d="M3 5.5C3 14.0604 9.93959 21 18.5 21C18.8862 21 19.2691 20.9859 19.6483 20.9581C20.0834 20.9262 20.3009 20.9103 20.499 20.7963C20.663 20.7019 20.8185 20.5345 20.9007 20.364C21 20.1582 21 19.9181 21 19.438V16.6207C21 16.2169 21 16.015 20.9335 15.842C20.8749 15.6891 20.7795 15.553 20.6559 15.4456C20.516 15.324 20.3262 15.255 19.9468 15.117L16.74 13.9509C16.2985 13.7904 16.0777 13.7101 15.8683 13.7237C15.6836 13.7357 15.5059 13.7988 15.3549 13.9058C15.1837 14.0271 15.0629 14.2285 14.8212 14.6314L14 16C11.3501 14.7999 9.2019 12.6489 8 10L9.36863 9.17882C9.77145 8.93713 9.97286 8.81628 10.0942 8.64506C10.2012 8.49408 10.2643 8.31637 10.2763 8.1317C10.2899 7.92227 10.2096 7.70153 10.0491 7.26005L8.88299 4.05321C8.745 3.67376 8.67601 3.48403 8.55442 3.3441C8.44701 3.22049 8.31089 3.12515 8.15802 3.06645C7.98496 3 7.78308 3 7.37932 3H4.56201C4.08188 3 3.84181 3 3.63598 3.09925C3.4655 3.18146 3.29814 3.33701 3.2037 3.50103C3.08968 3.69907 3.07375 3.91662 3.04189 4.35173C3.01413 4.73086 3 5.11378 3 5.5Z"
                                                        stroke="#fff"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"></path>
                                                </g></svg>
                                        </div>
                                        <div onClick={() => handleVideoCall(selectedUser.id)}>
                                            <svg viewBox="0 0 24 24" fill="none"
                                                width="22px" height="22px"
                                                xmlns="http://www.w3.org/2000/svg"><g
                                                    id="SVGRepo_bgCarrier"
                                                    strokeWidth="0"></g><g
                                                        id="SVGRepo_tracerCarrier"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"></g><g
                                                            id="SVGRepo_iconCarrier">
                                                    <path
                                                        d="M16 10L18.5768 8.45392C19.3699 7.97803 19.7665 7.74009 20.0928 7.77051C20.3773 7.79703 20.6369 7.944 20.806 8.17433C21 8.43848 21 8.90095 21 9.8259V14.1741C21 15.099 21 15.5615 20.806 15.8257C20.6369 16.056 20.3773 16.203 20.0928 16.2295C19.7665 16.2599 19.3699 16.022 18.5768 15.5461L16 14M6.2 18H12.8C13.9201 18 14.4802 18 14.908 17.782C15.2843 17.5903 15.5903 17.2843 15.782 16.908C16 16.4802 16 15.9201 16 14.8V9.2C16 8.0799 16 7.51984 15.782 7.09202C15.5903 6.71569 15.2843 6.40973 14.908 6.21799C14.4802 6 13.9201 6 12.8 6H6.2C5.0799 6 4.51984 6 4.09202 6.21799C3.71569 6.40973 3.40973 6.71569 3.21799 7.09202C3 7.51984 3 8.07989 3 9.2V14.8C3 15.9201 3 16.4802 3.21799 16.908C3.40973 17.2843 3.71569 17.5903 4.09202 17.782C4.51984 18 5.07989 18 6.2 18Z"
                                                        stroke="#fff"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"></path>
                                                </g></svg>
                                        </div>
                                        <div>
                                            <svg
                                                fill="#fff"
                                                viewBox="0 0 32 32"
                                                width="22px"
                                                height="22px"
                                                id="Glyph"
                                                version="1.1"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                                <g id="SVGRepo_iconCarrier">
                                                    <path
                                                        d="M13,16c0,1.654,1.346,3,3,3s3-1.346,3-3s-1.346-3-3-3S13,14.346,13,16z"
                                                        id="XMLID_294_"
                                                    ></path>
                                                    <path
                                                        d="M13,26c0,1.654,1.346,3,3,3s3-1.346,3-3s-1.346-3-3-3S13,24.346,13,26z"
                                                        id="XMLID_295_"
                                                    ></path>
                                                    <path
                                                        d="M13,6c0,1.654,1.346,3,3,3s3-1.346,3-3s-1.346-3-3-3S13,4.346,13,6z"
                                                        id="XMLID_297_"
                                                    ></path>
                                                </g>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="chat_card d-flex flex-column gap-2">
                                    <div
                                        className="chat_time d-flex align-items-center justify-content-center">
                                        <h4>{currentDate}</h4>
                                    </div>

                                    <div>
                                        {messages
                                            .filter((msg) =>
                                                (selectedUser && ((msg.user === selectedUser.email && msg.to === userData.id) || (msg.to === selectedUser.id && msg.user === userData.email))) ||
                                                (!selectedUser && (msg.user === userData.email || msg.to === userData.id))
                                            )
                                            .map((msg, index) => (
                                                <div
                                                    key={index}
                                                    className={`row justify-content-${msg.user === userData.email ? 'end' : 'start'} ${msg.user === userData.email ? 'chat_out' : 'chat_in'}`}>
                                                    <div className={`col-xl-4 col-lg-5 col-md-5 col-sm-10 col-10 d-flex align-items-${msg.user === userData.email ? 'end' : 'start'} flex-column gap-3 justify-content-center`}>
                                                        <div className={`${msg.user === userData.email ? 'chat_out_card' : 'chat_in_card'}`}>
                                                            <p>{msg.text}</p>
                                                        </div>
                                                        <div className="message_from d-flex align-items-center gap-2">
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                    </div>
                                </div>
                                <div className="chatBoxOuter">
                                    <div className="chatBox">
                                        <div className="mice_icon">
                                            <svg
                                                fill="#000000"
                                                height="25px"
                                                width="25px"
                                                version="1.1"
                                                id="Layer_1"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 491.52 491.52"
                                            >
                                                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                                <g id="SVGRepo_iconCarrier">
                                                    <g>
                                                        <g>
                                                            <path d="M370.588,232.871c0,68.83-55.995,124.826-124.826,124.826c-68.83,0-124.832-55.996-124.832-124.826H79.52 c0,84.647,63.613,154.671,145.536,164.9v93.749h41.412v-93.749C348.39,387.542,412,317.518,412,232.871H370.588z"></path>
                                                        </g>
                                                    </g>
                                                    <g>
                                                        <g>
                                                            <path d="M245.762,0h-0.002c-43.144,0-78.241,35.1-78.241,78.238v154.633c0,43.138,35.097,78.235,78.241,78.236h0.002 c43.141,0,78.238-35.097,78.238-78.236V78.238C324,35.098,288.903,0,245.762,0z"></path>
                                                        </g>
                                                    </g>
                                                </g>
                                            </svg>
                                        </div>

                                        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Type your message here" />
                                        <div
                                            className="fileAttech d-flex align-items-center gap-2">
                                            <svg viewBox="0 0 24 24"
                                                width="25px"
                                                height="25px" fill="none"
                                                xmlns="http://www.w3.org/2000/svg"><g
                                                    id="SVGRepo_bgCarrier"
                                                    strokeWidth="0"></g><g
                                                        id="SVGRepo_tracerCarrier"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"></g><g
                                                            id="SVGRepo_iconCarrier">
                                                    <path
                                                        fillRule="evenodd"
                                                        clipRule="evenodd"
                                                        d="M7 8.00092L7 17C7 17.5523 6.55228 18 6 18C5.44772 18 5.00001 17.4897 5 16.9374C5 16.9374 5 16.9374 5 16.9374C5 16.937 5.00029 8.01023 5.00032 8.00092C5.00031 7.96702 5.00089 7.93318 5.00202 7.89931C5.00388 7.84357 5.00744 7.76644 5.01426 7.67094C5.02788 7.4803 5.05463 7.21447 5.10736 6.8981C5.21202 6.27011 5.42321 5.41749 5.85557 4.55278C6.28989 3.68415 6.95706 2.78511 7.97655 2.10545C9.00229 1.42162 10.325 1 12 1C13.6953 1 14.9977 1.42162 16.0235 2.10545C17.0429 2.78511 17.7101 3.68415 18.1444 4.55278C18.5768 5.41749 18.788 6.27011 18.8926 6.8981C18.9454 7.21447 18.9721 7.4803 18.9857 7.67094C18.9926 7.76644 18.9961 7.84357 18.998 7.89931C18.9991 7.93286 18.9997 7.96641 19 7.99998C19.0144 10.7689 19.0003 17.7181 19 18.001C19 18.0268 18.9993 18.0525 18.9985 18.0782C18.9971 18.1193 18.9945 18.175 18.9896 18.2431C18.9799 18.3791 18.961 18.5668 18.9239 18.7894C18.8505 19.2299 18.7018 19.8325 18.3944 20.4472C18.0851 21.0658 17.6054 21.7149 16.8672 22.207C16.1227 22.7034 15.175 23 14 23C12.825 23 11.8773 22.7034 11.1328 22.207C10.3946 21.7149 9.91489 21.0658 9.60557 20.4472C9.29822 19.8325 9.14952 19.2299 9.07611 18.7894C9.039 18.5668 9.02007 18.3791 9.01035 18.2431C9.00549 18.175 9.0029 18.1193 9.00153 18.0782C9.00069 18.0529 9.00008 18.0275 9 18.0022C8.99621 15.0044 9 12.0067 9 9.00902C9.00101 8.95723 9.00276 8.89451 9.00645 8.84282C9.01225 8.76155 9.02338 8.65197 9.04486 8.5231C9.08702 8.27011 9.17322 7.91749 9.35558 7.55278C9.53989 7.18415 9.83207 6.78511 10.2891 6.48045C10.7523 6.17162 11.325 6 12 6C12.675 6 13.2477 6.17162 13.7109 6.48045C14.1679 6.78511 14.4601 7.18415 14.6444 7.55278C14.8268 7.91749 14.913 8.27011 14.9551 8.5231C14.9766 8.65197 14.9877 8.76155 14.9936 8.84282C14.9984 8.91124 14.9999 8.95358 15 8.99794L15 17C15 17.5523 14.5523 18 14 18C13.4477 18 13 17.5523 13 17V9.00902C12.9995 8.99543 12.9962 8.93484 12.9824 8.8519C12.962 8.72989 12.9232 8.58251 12.8556 8.44722C12.7899 8.31585 12.7071 8.21489 12.6015 8.14455C12.5023 8.07838 12.325 8 12 8C11.675 8 11.4977 8.07838 11.3985 8.14455C11.2929 8.21489 11.2101 8.31585 11.1444 8.44722C11.0768 8.58251 11.038 8.72989 11.0176 8.8519C11.0038 8.93484 11.0005 8.99543 11 9.00902V17.9957C11.0009 18.0307 11.0028 18.0657 11.0053 18.1006C11.0112 18.1834 11.0235 18.3082 11.0489 18.4606C11.1005 18.7701 11.2018 19.1675 11.3944 19.5528C11.5851 19.9342 11.8554 20.2851 12.2422 20.543C12.6227 20.7966 13.175 21 14 21C14.825 21 15.3773 20.7966 15.7578 20.543C16.1446 20.2851 16.4149 19.9342 16.6056 19.5528C16.7982 19.1675 16.8995 18.7701 16.9511 18.4606C16.9765 18.3082 16.9888 18.1834 16.9947 18.1006C16.9972 18.0657 16.9991 18.0307 17 17.9956L16.9999 7.99892C16.9997 7.98148 16.9982 7.91625 16.9908 7.81343C16.981 7.67595 16.9609 7.47303 16.9199 7.2269C16.837 6.72989 16.6732 6.08251 16.3556 5.44722C16.0399 4.81585 15.5821 4.21489 14.9141 3.76955C14.2523 3.32838 13.325 3 12 3C10.675 3 9.7477 3.32838 9.08595 3.76955C8.41793 4.21489 7.96011 4.81585 7.64443 5.44722C7.32678 6.08251 7.16298 6.72989 7.08014 7.2269C7.03912 7.47303 7.019 7.67595 7.00918 7.81343C7.0025 7.90687 7.00117 7.9571 7 8.00092Z"
                                                        fill="#0F0F0F"></path>
                                                </g></svg>

                                            <svg viewBox="0 0 24 24" fill="none"
                                                width="25px"
                                                height="25px"
                                                xmlns="http://www.w3.org/2000/svg"><g
                                                    id="SVGRepo_bgCarrier"
                                                    strokeWidth="0"></g><g
                                                        id="SVGRepo_tracerCarrier"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"></g><g
                                                            id="SVGRepo_iconCarrier">
                                                    <path
                                                        d="M8.5 11C9.32843 11 10 10.3284 10 9.5C10 8.67157 9.32843 8 8.5 8C7.67157 8 7 8.67157 7 9.5C7 10.3284 7.67157 11 8.5 11Z"
                                                        fill="#0F0F0F"></path>
                                                    <path
                                                        d="M17 9.5C17 10.3284 16.3284 11 15.5 11C14.6716 11 14 10.3284 14 9.5C14 8.67157 14.6716 8 15.5 8C16.3284 8 17 8.67157 17 9.5Z"
                                                        fill="#0F0F0F"></path>
                                                    <path
                                                        d="M8.88875 13.5414C8.63822 13.0559 8.0431 12.8607 7.55301 13.1058C7.05903 13.3528 6.8588 13.9535 7.10579 14.4474C7.18825 14.6118 7.29326 14.7659 7.40334 14.9127C7.58615 15.1565 7.8621 15.4704 8.25052 15.7811C9.04005 16.4127 10.2573 17.0002 12.0002 17.0002C13.7431 17.0002 14.9604 16.4127 15.7499 15.7811C16.1383 15.4704 16.4143 15.1565 16.5971 14.9127C16.7076 14.7654 16.8081 14.6113 16.8941 14.4485C17.1387 13.961 16.9352 13.3497 16.4474 13.1058C15.9573 12.8607 15.3622 13.0559 15.1117 13.5414C15.0979 13.5663 14.9097 13.892 14.5005 14.2194C14.0401 14.5877 13.2573 15.0002 12.0002 15.0002C10.7431 15.0002 9.96038 14.5877 9.49991 14.2194C9.09071 13.892 8.90255 13.5663 8.88875 13.5414Z"
                                                        fill="#0F0F0F"></path>
                                                    <path
                                                        fillRule="evenodd"
                                                        clipRule="evenodd"
                                                        d="M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23ZM12 20.9932C7.03321 20.9932 3.00683 16.9668 3.00683 12C3.00683 7.03321 7.03321 3.00683 12 3.00683C16.9668 3.00683 20.9932 7.03321 20.9932 12C20.9932 16.9668 16.9668 20.9932 12 20.9932Z"
                                                        fill="#0F0F0F"></path>
                                                </g></svg>
                                        </div>
                                    </div>
                                    <button className="btn btn-primary sendBtn" onClick={sendMessage}>
                                        <svg viewBox="0 0 24 24" fill="none"
                                            width="32px"
                                            height="32px"
                                            xmlns="http://www.w3.org/2000/svg"><g
                                                id="SVGRepo_bgCarrier"
                                                strokeWidth="0"></g><g
                                                    id="SVGRepo_tracerCarrier"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"></g><g
                                                        id="SVGRepo_iconCarrier"> <path
                                                            d="M6.99811 10.2467L7.43298 11.0077C7.70983 11.4922 7.84825 11.7344 7.84825 12C7.84825 12.2656 7.70983 12.5078 7.43299 12.9923L7.43298 12.9923L6.99811 13.7533C5.75981 15.9203 5.14066 17.0039 5.62348 17.5412C6.1063 18.0785 7.24961 17.5783 9.53623 16.5779L15.8119 13.8323C17.6074 13.0468 18.5051 12.654 18.5051 12C18.5051 11.346 17.6074 10.9532 15.8119 10.1677L9.53624 7.4221C7.24962 6.42171 6.1063 5.92151 5.62348 6.45883C5.14066 6.99615 5.75981 8.07966 6.99811 10.2467Z"
                                                            fill="#fff"></path>
                                            </g></svg>
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Chat;