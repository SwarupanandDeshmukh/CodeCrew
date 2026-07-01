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
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
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

  function openInviteModal() {
    setSelectedUsers([]);
    axiosInstance.get('/users/getUsers')
      .then((res) => {
        setAllUsers(res.data.allUser);
        setShowInviteModal(true);
      }).catch((err) => {
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
      setShowInviteModal(false);
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

            {/* Invite - Owner only */}
            {isOwner && (
            <button
              onClick={openInviteModal}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-indigo-600"
              title="Invite people"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>
            )}
            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-indigo-600"
              title="View members"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

      {/* Side Panel - Members */}
      <aside className={`bg-white border-slate-200 flex flex-col transition-all duration-300 ${isSidePanelOpen ? 'w-72 border-l translate-x-0' : 'w-0 border-0 translate-x-full overflow-hidden'
        }`}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-sm">Members</h3>
          <button onClick={() => setIsSidePanelOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {room?.participants && room.participants.length > 0 ? (
            room.participants.map((p, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors mb-1">
                <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-white text-xs font-bold">
                  {p.username?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="text-sm font-medium text-slate-700">{p.username || 'Unknown'}</span>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-sm text-center py-4">No members</p>
          )}
        </div>
      </aside>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-slideIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Invite People</h2>
                <p className="text-slate-400 text-sm">to {room?.roomName}</p>
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
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selectedUsers.includes(u._id)
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

export default Room
