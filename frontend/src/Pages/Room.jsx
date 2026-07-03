import React, { useState, useContext, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosInstance from '../config/axios';
import { initializeSocket, sendMessage, recieveMessage } from '../config/socket';
import { UserContext } from '../context/user.context';
import Editor from '@monaco-editor/react';

const LANGUAGES = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python' },
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'java' },
  { label: 'C', value: 'c' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'JSON', value: 'json' },
];

const Room = () => {

  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const [room, setRoom] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const MessageBox = useRef(null);

  // Coding session state
  const [codingSession, setCodingSession] = useState(false);
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  const [editorCode, setEditorCode] = useState('// Start coding here...\n');
  const [kickedFromRoom, setKickedFromRoom] = useState(null);

  const isOwner = room?.createdBy?.toString() === (user?._id || user?.userId)?.toString();

  useEffect(() => {
    // First join the room (handles both existing members and new joins via URL)
    axiosInstance.post('/room/join', { roomId })
      .then((res) => {
        setRoom(res.data.room);
        setJoined(true);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Room not found');
        setLoading(false);
      });
  }, [roomId]);

  useEffect(() => {
    if (!joined || !roomId) return;

    initializeSocket(roomId);

    const senderName = user?.username || user?.email || 'Anonymous';

    recieveMessage('chat-history', history => {
      const formattedHistory = history.map(msg => ({
        message: msg.message,
        sender: msg.sender,
        type: msg.sender === 'AI' ? 'ai' : msg.sender === senderName ? 'outgoing' : 'incoming'
      }));
      setMessages(formattedHistory);
    });

    recieveMessage('room-state', data => {
      if (data.codingSession !== undefined) {
        setCodingSession(data.codingSession);
      }
    });

    recieveMessage('coding-session-toggle', data => {
      setCodingSession(data.open);
    });

    recieveMessage('project-message', data => {
      setMessages(prev => [
        ...prev,
        {
          ...data,
          type: data.sender === 'AI' ? 'ai' : 'incoming'
        }
      ]);
    });

    recieveMessage('user-left', data => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants.filter(
            p => p.userId?.toString() !== data.userId?.toString()
          )
        };
      });
    });

    recieveMessage('user-kicked', data => {
      const currentUserId = (user?._id || user?.userId)?.toString();
      if (data.userId?.toString() === currentUserId) {
        setKickedFromRoom(data.roomName);
      } else {
        setRoom(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: prev.participants.filter(
              p => p.userId?.toString() !== data.userId?.toString()
            )
          };
        });
      }
    });

  }, [joined, roomId]);

  useEffect(() => {
    if (MessageBox.current) {
      MessageBox.current.scrollTop = MessageBox.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    if (!message.trim()) return;

    const senderName = user?.username || user?.email || 'Anonymous';

    sendMessage('project-message', {
      message,
      sender: senderName
    });

    setMessages(prev => [...prev, { message, sender: senderName, type: 'outgoing' }]);
    setMessage('');
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function openSettings(tab = 'info') {
    setActiveTab(tab);
    setShowSettingsModal(true);
    if (isOwner && allUsers.length === 0) {
      axiosInstance.get('/users/getUsers')
        .then((res) => {
          setAllUsers(res.data.allUser);
        }).catch((err) => {
          console.log(err);
        });
    }
  }

  function deleteRoom() {
    axiosInstance.delete(`/room/delete/${roomId}`)
      .then(() => {
        navigate('/');
      }).catch(err => {
        console.log(err);
      });
  }

  function sendInvitations() {
    if (selectedUsers.length === 0) return;

    axiosInstance.post('/room/invite', {
      roomId: room.roomId,
      roomName: room.roomName,
      recipientIds: selectedUsers
    }).then((res) => {
      setSelectedUsers([]);
    }).catch((err) => {
      console.log(err);
    });
  }

  function handleUserToggle(userId) {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }

  function handleLeaveRoom() {
    axiosInstance.post('/room/leave', { roomId })
      .then(() => {
        sendMessage('leave-room', { userId: user?._id || user?.userId, username: user?.username });
        navigate('/');
      })
      .catch(err => {
        console.log(err);
      });
  }

  function kickUser(userId, username) {
    sendMessage('kick-user', { userId, username });
  }

  function ConvertString(InputMessage) {
    try {
      const msg = JSON.parse(InputMessage);
      return msg.text || InputMessage;
    } catch {
      return InputMessage;
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-row gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce [animation-delay:-.3s]"></div>
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce [animation-delay:-.5s]"></div>
          </div>
          <p className="text-slate-400 text-sm font-medium">Joining room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">{error}</h3>
          <button onClick={() => navigate('/')} className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">

      {/* Chat Section */}
      <section className={`flex flex-col h-full relative transition-all duration-300 ${codingSession ? 'w-[420px] min-w-[380px]' : 'flex-1'}`}>
        {/* Header */}
        <header className='bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10'>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h2 className="font-semibold text-slate-800 text-sm">{room?.roomName || 'Room'}</h2>
              <p className="text-xs text-slate-400 font-mono">#{room?.roomId}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Code Session Toggle - Owner only */}
            {isOwner && (
              <button
                onClick={() => {
                  setCodingSession(!codingSession);
                  sendMessage('coding-session-toggle', { open: !codingSession });
                }}
                className={`p-2 rounded-lg transition-colors ${codingSession ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-slate-100 text-slate-500 hover:text-indigo-600'}`}
                title={codingSession ? 'Close coding session' : 'Start coding session'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>
            )}

            {/* Room Settings */}
            <button
              onClick={() => openSettings('info')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-indigo-600"
              title="Room Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Messages */}
        <div ref={MessageBox}
          className="messageBox flex-1 flex flex-col p-4 gap-3 overflow-auto">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm">No messages yet. Start the conversation!</p>
                <p className="text-slate-300 text-xs mt-1">Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">@ai</span> to talk with AI</p>
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-sm flex flex-col p-3 rounded-2xl animate-slideIn ${msg.type === 'outgoing'
                ? 'ml-auto bg-indigo-600 text-white rounded-br-md'
                : msg.type === 'ai'
                  ? 'bg-violet-50 border border-violet-100 text-slate-800 rounded-bl-md'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'
                }`}
            >
              <span className={`text-xs font-medium mb-1 ${msg.type === 'outgoing' ? 'text-indigo-200' : msg.type === 'ai' ? 'text-violet-500' : 'text-indigo-500'
                }`}>
                {msg.type === 'ai' ? '✨ AI' : msg.sender}
              </span>

              {msg.type === 'ai' ? (
                <div className='text-sm whitespace-pre-wrap break-words'>
                  {ConvertString(msg.message)}
                </div>
              ) : (
                <span className="text-sm whitespace-pre-wrap break-words">{msg.message}</span>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-slate-200">
          <div className="flex items-center gap-2">
            <input
              type='text'
              placeholder='Type a message...'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className='flex-1 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm'
            />
            <button
              onClick={send}
              disabled={!message.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl transition-all active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Coding Session Panel */}
      {codingSession && (
        <section className="flex-1 min-w-0 flex flex-col h-full border-l border-slate-200 bg-[#1e1e1e] animate-fadeIn">
          {/* Editor Header */}
          <div className="bg-[#252526] border-b border-[#3c3c3c] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-[#cccccc] text-xs font-medium">Coding Session</span>
              </div>
              <div className="h-4 w-px bg-[#3c3c3c]"></div>
              <select
                value={editorLanguage}
                onChange={(e) => setEditorLanguage(e.target.value)}
                className="bg-[#3c3c3c] text-[#cccccc] text-xs rounded-md px-2.5 py-1 border border-[#555] focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
            {isOwner && (
              <button
                onClick={() => {
                  setCodingSession(false);
                  sendMessage('coding-session-toggle', { open: false });
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-[#cccccc] text-xs rounded-md transition-colors"
                title="Close coding session"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            )}
          </div>

          {/* Monaco Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={editorLanguage}
              value={editorCode}
              onChange={(value) => setEditorCode(value || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
                fontLigatures: true,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                padding: { top: 16 },
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                bracketPairColorization: { enabled: true },
                automaticLayout: true,
              }}
            />
          </div>
        </section>
      )}

      {/* Unified Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[70]" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[600px] max-h-[85vh] flex overflow-hidden animate-slideIn" onClick={(e) => e.stopPropagation()}>
            {/* Sidebar */}
            <div className="w-64 bg-slate-50 border-r border-slate-200 p-5 flex flex-col">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 px-1">Settings</h2>
              <nav className="flex-1 flex flex-col gap-1.5">
                <button onClick={() => setActiveTab('info')} className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left flex items-center gap-3 ${activeTab === 'info' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Room Info
                </button>
                <button onClick={() => setActiveTab('members')} className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left flex items-center justify-between ${activeTab === 'members' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    Members
                  </div>
                  <span className="bg-indigo-100 text-indigo-700 text-xs py-0.5 px-2 rounded-full font-bold">{room?.participants?.length || 0}</span>
                </button>
                {isOwner && (
                  <button onClick={() => setActiveTab('invite')} className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left flex items-center gap-3 ${activeTab === 'invite' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    Invite People
                  </button>
                )}
              </nav>
              <div className="mt-4 pt-5 border-t border-slate-200">
                {isOwner ? (
                  <button onClick={deleteRoom} className="w-full px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-sm rounded-xl text-sm font-semibold transition-all text-left flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete Room
                  </button>
                ) : (
                  <button onClick={handleLeaveRoom} className="w-full px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-sm rounded-xl text-sm font-semibold transition-all text-left flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Leave Room
                  </button>
                )}
              </div>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 p-8 flex flex-col bg-white relative overflow-hidden">
              <button onClick={() => setShowSettingsModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              {activeTab === 'info' && (
                <div className="animate-fadeIn">
                  <h3 className="text-2xl font-bold text-slate-800 mb-8">Room Information</h3>
                  <div className="space-y-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Room Name</label>
                      <p className="text-slate-800 font-bold text-xl mt-1">{room?.roomName}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Room ID</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-mono font-bold border border-indigo-100">{room?.roomId}</code>
                      </div>
                    </div>
                    <div className="flex gap-16 pt-4 border-t border-slate-200">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Members</label>
                        <div className="flex items-center gap-2 mt-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          <p className="text-slate-800 font-bold text-xl">{room?.participants?.length || 0}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Role</label>
                        <div className="mt-2">
                          {isOwner ? <span className="text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg text-sm font-bold shadow-sm">Owner</span> : <span className="text-slate-700 bg-slate-200 border border-slate-300 px-3 py-1 rounded-lg text-sm font-bold shadow-sm">Member</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="animate-fadeIn flex flex-col h-full min-h-0">
                  <h3 className="text-2xl font-bold text-slate-800 mb-6">Room Members</h3>
                  <div className="relative mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                      type="text" 
                      placeholder="Search members..." 
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                    {room?.participants?.filter(p => p.username?.toLowerCase().includes(memberSearchQuery.toLowerCase())).map((p, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all group">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                          {p.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-slate-800 truncate">{p.username || 'Unknown'}</p>
                          {p.userId?.toString() === room?.createdBy?.toString() ? (
                             <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mt-0.5">Owner</p>
                          ) : (
                             <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">Member</p>
                          )}
                        </div>
                        {isOwner && p.userId?.toString() !== (user?._id || user?.userId)?.toString() && (
                          <button
                            onClick={() => kickUser(p.userId, p.username)}
                            className="p-2.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Remove from room"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {room?.participants?.filter(p => p.username?.toLowerCase().includes(memberSearchQuery.toLowerCase())).length === 0 && (
                      <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        <p className="font-medium">No members found.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'invite' && isOwner && (
                <div className="animate-fadeIn flex flex-col h-full min-h-0">
                  <h3 className="text-2xl font-bold text-slate-800 mb-6">Invite People</h3>
                  <div className="relative mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                      type="text" 
                      placeholder="Search users to invite..." 
                      value={inviteSearchQuery}
                      onChange={(e) => setInviteSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                    {allUsers.filter(u => u.username?.toLowerCase().includes(inviteSearchQuery.toLowerCase()) || u.email?.toLowerCase().includes(inviteSearchQuery.toLowerCase())).map((u) => {
                      const isMember = room?.participants?.some(p => p.userId?.toString() === u._id?.toString());
                      return (
                        <div
                          key={u._id}
                          className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all border-2 ${isMember ? 'opacity-60 cursor-not-allowed border-slate-100 bg-slate-50' : selectedUsers.includes(u._id) ? 'border-indigo-500 bg-indigo-50/50 cursor-pointer shadow-sm' : 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50 cursor-pointer'}`}
                          onClick={() => !isMember && handleUserToggle(u._id)}
                        >
                          <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-sm font-bold">
                            {u.username?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{u.username || 'User'}</p>
                            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{u.email}</p>
                          </div>
                          {isMember ? (
                            <span className="text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1.5 rounded-lg">Already joined</span>
                          ) : selectedUsers.includes(u._id) ? (
                            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full border-2 border-slate-300"></div>
                          )}
                        </div>
                      );
                    })}
                    {allUsers.filter(u => u.username?.toLowerCase().includes(inviteSearchQuery.toLowerCase()) || u.email?.toLowerCase().includes(inviteSearchQuery.toLowerCase())).length === 0 && (
                      <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        <p className="font-medium">No users found.</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={sendInvitations}
                    disabled={selectedUsers.length === 0}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 disabled:shadow-none text-base"
                  >
                    Send Invites {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Kicked from Room Popup */}
      {kickedFromRoom && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[60]">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm animate-slideIn text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Removed from Room</h2>
            <p className="text-slate-500 text-sm mb-6">
              You have been removed from <span className="font-semibold text-slate-700">{kickedFromRoom}</span> by the room owner.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Room
