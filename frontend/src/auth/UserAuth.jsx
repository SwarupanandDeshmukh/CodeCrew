import React from 'react'
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import { useState,useContext, useEffect } from 'react';
import axiosInstance from '../config/axios';


const UserAuth = ({children}) => {

    const [loading,isLoading] = useState(true);

    const {user, setUser} = useContext(UserContext);

    const token = localStorage.getItem('token');

    const navigate = useNavigate();

    useEffect(()=>{
        if(user)
        {
            const timer = setTimeout(()=> isLoading(false),800);
            return ()=>clearTimeout(timer);
        }

        if(!token)
        {
            navigate('/login');
            return;
        }

        // Token exists but user context is null (page was refreshed) — re-hydrate
        axiosInstance.get('/users/profile')
            .then((res)=>{
                setUser(res.data);
                isLoading(false);
            })
            .catch(()=>{
                localStorage.removeItem('token');
                navigate('/login');
            });

    },[])


    if(loading)
    {
        return (
            <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
                <div className="flex flex-col items-center gap-4">
                    <div className="flex flex-row gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce"></div>
                        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce [animation-delay:-.3s]"></div>
                        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce [animation-delay:-.5s]"></div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Loading...</p>
                </div>
            </div>
        )
    }
  return (
    <>
        {children}
    </>
    
  )
}

export default UserAuth