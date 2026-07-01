import React from 'react'
import {BrowserRouter,Route,Routes} from 'react-router-dom';
import Home from '../Pages/Home.jsx';
import Login from '../Pages/Login.jsx';
import Register from '../Pages/Register.jsx';
import Room from '../Pages/Room.jsx';
import UserAuth from '../auth/UserAuth.jsx';

const AppRoutes = () => {
  return (
    <BrowserRouter>
    <Routes>

        <Route path='/' element={<UserAuth><Home/></UserAuth>}/>
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/room/:roomId' element={<UserAuth><Room /></UserAuth>} />

    </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes;