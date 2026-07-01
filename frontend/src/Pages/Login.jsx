import React from 'react'
import axiosInstance from '../config/axios.js'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserContext } from '../context/user.context.jsx'
import { useContext } from 'react'

const Login = () => {

  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [error,setError] = useState('');

  const {setUser} = useContext(UserContext);

  const navigate = useNavigate();

  function submitHandler(e)
  {
    e.preventDefault();
    setError('');
      axiosInstance.post('/users/login',{
        email,
        password
      }).then((res) =>{
        navigate('/');
        localStorage.setItem('token',res.data.token);
        setUser(res.data.user);
      })
      .catch((error)=>{
        setError(error.response?.data?.error || 'Login failed');
      })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 w-full max-w-md animate-fadeIn">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
          <p className="text-slate-400 text-sm mt-1">Sign in to continue to ChitChat</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
            {typeof error === 'string' ? error : 'Invalid credentials'}
          </div>
        )}

        <form className="space-y-4" onSubmit={submitHandler}>
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              type="email"
              id="email"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              type="password"
              id="password"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 active:scale-[0.98]"
          >
            Sign In
          </button>
        </form>
        <div className="mt-6 text-center">
          <span className="text-slate-500 text-sm">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Create one
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}

export default Login