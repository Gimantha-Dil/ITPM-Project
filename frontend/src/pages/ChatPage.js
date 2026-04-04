import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiSend } from 'react-icons/fi';

const ChatPage = () => {
  const { chatId } = useParams();
  const { api, user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    try {
      const res = await api.get('/chat/my-chats');
      setChats(res.data);
    } catch (err) {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const res = await api.get(`/chat/${id}`);
      setActiveChat(res.data);
      setMessages(res.data.messages || []);
    } catch (err) {
      toast.error('Failed to load messages');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    try {
      await api.post(`/chat/${activeChat._id}/message`, { content: newMessage });
      setNewMessage('');
      fetchMessages(activeChat._id);
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const getOtherParticipant = (chat) => {
    return chat.participants?.find(p => p._id !== user?._id);
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Messages</h1>
      </div>

      <div className="chat-container">
        <div className="chat-list">
          {chats.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
              <p>No conversations yet</p>
              <p className="text-small">Start a chat from a note or session page</p>
            </div>
          ) : (
            chats.map(chat => {
              const other = getOtherParticipant(chat);
              return (
                <div
                  key={chat._id}
                  className={`chat-list-item ${activeChat?._id === chat._id ? 'active' : ''}`}
                  onClick={() => fetchMessages(chat._id)}
                >
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{other?.fullName || 'User'}</div>
                  <div className="text-small text-muted" style={{ marginTop: 2 }}>
                    {chat.relatedNote?.title || chat.relatedSession?.title || ''}
                  </div>
                  {chat.lastMessage && (
                    <div className="text-small text-muted" style={{ marginTop: 4 }}>
                      {chat.lastMessage.content?.substring(0, 40)}...
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="chat-messages">
          {activeChat ? (
            <>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>
                {getOtherParticipant(activeChat)?.fullName}
                {activeChat.relatedNote && <span className="text-small text-muted"> • {activeChat.relatedNote.title}</span>}
              </div>
              <div className="messages-container">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`message ${(msg.sender?._id || msg.sender) === user?._id ? 'sent' : 'received'}`}
                  >
                    {msg.content}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} className="chat-input-container">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ borderRadius: 24 }}>
                  <FiSend />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}></div>
                <p>Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
