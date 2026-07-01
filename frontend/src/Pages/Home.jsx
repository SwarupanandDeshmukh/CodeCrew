import React from 'react'
import { UserContext } from '../context/user.context'
import { useContext,useState } from 'react'
import axiosInstance from '../config/axios';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {

  const {user,setUser} = useContext(UserContext);
  const [showModal, setShowModal] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [rooms, setRooms] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRoomId, setInviteRoomId] = useState('');
  const [inviteRoomName, setInviteRoomName] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const navigate = useNavigate();

  function createRoom(e)
  {
    e.preventDefault();
    setError('');
    axiosInstance.post('/room/create',{
      roomId: roomId,
      roomName: roomName
    }).then((res) =>{
      setShowModal(false);
      setRoomId('');
      setRoomName('');
      getRooms();
    })
    .catch((error) =>{
      setError(error.response?.data || 'Failed to create room');
    });
  }

  function getRooms()
  {
    axiosInstance.get('/room/allRooms')
    .then((res)=>{
      setRooms(res.data.AllRooms);
    }).catch((err)=>{
      console.log(err);
    });
  }

  function getNotifications()
  {
    axiosInstance.get('/room/notifications')
    .then((res)=>{
      setNotifications(res.data.notifications);
    }).catch((err)=>{
      console.log(err);
    });
  }

  function acceptInvitation(notification)
  {
    axiosInstance.post('/room/join',{
      roomId: notification.roomId
    }).then((res)=>{
      axiosInstance.put(`/room/notifications/${notification._id}/read`)
      .then(()=>{
        getNotifications();
        getRooms();
      });
    }).catch((err)=>{
      console.log(err);
    });
  }

  function dismissNotification(notificationId)
  {
    axiosInstance.put(`/room/notifications/${notificationId}/read`)
    .then(()=>{
      getNotifications();
    }).catch((err)=>{
      console.log(err);
    });
  }

  function openInviteModal(room)
  {
    setInviteRoomId(room.roomId);
    setInviteRoomName(room.roomName);
    setSelectedUsers([]);
    axiosInstance.get('/users/getUsers')
    .then((res)=>{
      setAllUsers(res.data.allUser);
      setShowInviteModal(true);
    }).catch((err)=>{
      console.log(err);
    });
  }

  function sendInvitations()
  {
    if(selectedUsers.length === 0) return;

    axiosInstance.post('/room/invite',{
      roomId: inviteRoomId,
      roomName: inviteRoomName,
      recipientIds: selectedUsers
    }).then((res)=>{
      setShowInviteModal(false);
      setSelectedUsers([]);
    }).catch((err)=>{
      console.log(err);
    });
  }

  function handleUserToggle(userId)
  {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }

  function handleLogout()
  {
    axiosInstance.get('/users/logout')
      .then(() => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
      })
      .catch((err) => {
        console.error(err);
        // Fallback to clearing local state even if backend fails
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
      });
  }

  function copyRoomLink(rid)
  {
    const link = `${window.location.origin}/room/${rid}`;
    navigator.clipboard.writeText(link);
  }

  useEffect(() =>{
    getRooms();
    getNotifications();

    const interval = setInterval(getNotifications, 10000);
    return () => clearInterval(interval);
  },[]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800">ChitChat</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-slideDown z-50">
                  <div className="p-3 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-sm">No new notifications</div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif._id} className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <p className="text-sm text-slate-700">
                            <span className="font-semibold text-indigo-600">{notif.senderUsername}</span> invited you to join
                            <span className="font-semibold"> {notif.roomName}</span>
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => acceptInvitation(notif)}
                              className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                            >
                              Join Room
                            </button>
                            <button
                              onClick={() => dismissNotification(notif._id)}
                              className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User info */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">
                {user?.username || user?.email || 'User'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Your Rooms</h2>
            <p className="text-slate-400 text-sm mt-1">Chat and collaborate in real-time</p>
          </div>
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 transition-all active:scale-[0.98]"
            onClick={() => setShowModal(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Room
          </button>
        </div>

        {/* Rooms Grid */}
        {rooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-600 mb-1">No rooms yet</h3>
            <p className="text-slate-400 text-sm">Create your first room to start chatting</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room, index) => (
              <div
                key={room._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer group animate-slideIn"
                style={{animationDelay: `${index * 0.05}s`}}
              >
                <div
                  className="p-5"
                  onClick={() => navigate(`/room/${room.roomId}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-800 text-lg mb-1">{room.roomName}</h3>
                  <p className="text-slate-400 text-xs font-mono mb-3">#{room.roomId}</p>
                  <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{room.participants?.length || 0} members</span>
                  </div>
                </div>
                <div className="px-5 pb-4 flex gap-2">
                  <button
                    onClick={(e) => {e.stopPropagation(); copyRoomLink(room.roomId);}}
                    className="flex-1 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200"
                    title="Copy room link"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={(e) => {e.stopPropagation(); openInviteModal(room);}}
                    className="flex-1 py-2 text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors border border-indigo-200"
                  >
                    Invite
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-slideIn" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Create New Room</h2>
            <p className="text-slate-400 text-sm mb-5">Enter a unique room ID and name</p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                {typeof error === 'string' ? error : 'Something went wrong'}
              </div>
            )}
            
            <form onSubmit={createRoom}>
              <div className="mb-3">
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Room ID</label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
                  type="text"
                  placeholder="e.g. my-cool-room"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  required
                />
              </div>
              <div className="mb-5">
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Room Name</label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  type="text"
                  placeholder="e.g. Design Team Chat"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                  onClick={() => {setShowModal(false); setError('');}}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm shadow-indigo-200"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Users Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-slideIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Invite People</h2>
                <p className="text-slate-400 text-sm">to {inviteRoomName}</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-2 mb-4 overflow-y-auto max-h-64">
              {allUsers.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No other users found</p>
              ) : (
                allUsers.map(u => (
                  <div
                    key={u._id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedUsers.includes(u._id) 
                        ? 'border-indigo-300 bg-indigo-50' 
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                    }`}
                    onClick={() => handleUserToggle(u._id)}
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-400 flex items-center justify-center text-white text-sm font-bold">
                      {u.username?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{u.username || 'User'}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                    {selectedUsers.includes(u._id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                ))
              )}
            </div>
            <button
              onClick={sendInvitations}
              disabled={selectedUsers.length === 0}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-all text-sm"
            >
              Send Invite{selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home