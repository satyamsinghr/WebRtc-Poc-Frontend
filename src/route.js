import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Signin from './components/auth/signin';
import Signup from './components/auth/signup';
import Chat from './components/Chat';
import VideoApp from './components/videoApp';
import ProtectedRoute from './/ProtectedRoute';
const Routing = () => {
    return (
            <Routes>
              <Route path="/" element={<Signin />} />
              <Route path="/signup" element={<Signup />} />
              {/* <Route path="/chat" element={<Chat />} />
              <Route path="/video/:userId" element={<VideoApp />} /> */}
               <Route path="/chat" element={<ProtectedRoute element={Chat} />} />
               <Route path="/video/:userId" element={<ProtectedRoute element={VideoApp} />} />
            </Routes>
    )
}
  
export default Routing;