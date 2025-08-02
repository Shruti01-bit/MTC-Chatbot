import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sun, Moon, Copy, Check } from 'lucide-react';

// Gemini API Service
const geminiApi = {
  async sendMessage(message, history = []) {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;


    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    if (!API_KEY) {
      throw new Error('API key is not set. Please set VITE_GEMINI_API_KEY in your environment variables.');
    }


    
    // Format conversation history for Gemini API
    const contents = [
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        
        parts: [{ text: message }]
      }
    ];

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: contents
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to get response from AI. Please check your API key and try again.');
    }
  }
};

// Custom hook for chat functionality
const useChat = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  // Save to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async (content) => {
    if (!content.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    try {
      const response = await geminiApi.sendMessage(content, messages);
      
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message);
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    localStorage.removeItem('chatHistory');
  };

  return { messages, isTyping, error, sendMessage, clearChat };
};

// Typing Indicator Component
const TypingIndicator = () => (
  <div className="flex items-center space-x-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-xs">
    <Bot className="w-5 h-5 text-blue-500" />
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
    </div>
    <span className="text-sm text-gray-500">AI is thinking...</span>
  </div>
);

// Message Component
const Message = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-500 ml-2' : 'bg-gray-300 dark:bg-gray-600 mr-2'
        }`}>
          {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
        </div>
        
        <div className={`rounded-lg px-4 py-2 ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : message.isError 
              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
        }`}>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className={`text-xs opacity-70 ${isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {formatTime(message.timestamp)}
            </div>
            {!isUser && (
              <button
                onClick={copyToClipboard}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Copy message"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Input Box Component
const InputBox = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input);
      setInput('');
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  return (
    <form onSubmit={handleSubmit} className="border-t dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <div className="flex items-end space-x-2 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            rows="1"
            disabled={disabled}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg p-3 transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        Press Enter to send • Shift+Enter for new line
      </div>
    </form>
  );
};

// Main Chat Interface Component
const ChatInterface = () => {
  const { messages, isTyping, error, sendMessage, clearChat } = useChat();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const messagesEndRef = useRef(null);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-900 transition-colors">
        {/* Header */}
        <div className="border-b dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
              <Bot className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">AI Chat Assistant</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">By Shruti</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Toggle theme"
              >
                {darkMode ? <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
              <button
                onClick={clearChat}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                title="Clear chat"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900" style={{ height: 'calc(100vh - 140px)' }}>
          <div className="max-w-4xl mx-auto p-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Start a conversation</h3>
                <p className="text-gray-400 dark:text-gray-500">Shruti Chatbot here to help you !!</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <Message key={message.id} message={message} />
                ))}
                {isTyping && <TypingIndicator />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        {error && (
          <div className="text-red-500 text-sm text-center mb-2">
            {error}
            </div>
          )}
        <InputBox onSendMessage={sendMessage} disabled={isTyping} />
      </div>
    </div>
  );
};

export default ChatInterface;