import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Signin from './components/auth/signin';
import Signup from './components/auth/signup';
import Chat from './components/Chat';
const Routing = () => {
    return (
            <Routes>
              <Route path="/" element={<Signin />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/chat" element={<Chat />} />
           
            </Routes>
    )
}
  
export default Routing;