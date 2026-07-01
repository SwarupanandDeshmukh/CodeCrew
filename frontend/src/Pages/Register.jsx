import axiosInstance from '../config/axios'
import React from 'react'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import { useContext } from 'react'

const Register = () => {

  const [username,setUsername] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [error,setError] = useState('');

  const {setUser} = useContext(UserContext);

  const navigate = useNavigate();

  function submitHandler(e)
  {
    e.preventDefault();
    setError('');

    axiosInstance.post('/users/register',{
      username,
      email,
      password
    }).then((res) =>{
      navigate('/');
      localStorage.setItem('token',res.data.token);
      setUser(res.data.user);
    })
    .catch((error) =>{
      setError(error.response?.data || 'Registration failed');
    })
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 w-full max-w-md animate-fadeIn">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Create Account</h2>
          <p className="text-slate-400 text-sm mt-1">Join ChitChat and start collaborating</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
            {typeof error === 'string' ? error : 'Something went wrong'}
          </div>
        )}

        <form className="space-y-4" onSubmit={submitHandler}>
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5" htmlFor="username">
              Username
            </label>
            <input
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              type="text"
              id="username"
              placeholder="Choose a username"
              required
            />
          </div>
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
              placeholder="Create a password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 active:scale-[0.98]"
          >
            Create Account
          </button>
        </form>
        <div className="mt-6 text-center">
          <span className="text-slate-500 text-sm">
            Already have an account?&nbsp;
            <Link
              to="/login"
              className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Sign In
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}

export default Register