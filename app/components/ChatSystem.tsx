"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, Send, Paperclip, X, Users } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import FileUpload from "./FileUpload"
import toast from "react-hot-toast"

interface Message {
  _id: string
  sender: {
    _id: string
    firstName: string
    lastName: string
  }
  recipient: {
    _id: string
    firstName: string
    lastName: string
  }
  message: string
  type: string
  attachments: Array<{
    url: string
    filename: string
    type: string
  }>
  read: boolean
  createdAt: string
}

interface Conversation {
  conversationId: string
  otherUser: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  lastMessage: Message
  unreadCount: number
}

export default function ChatSystem() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && user) {
      fetchConversations()
    }
  }, [isOpen, user])

  useEffect(() => {
    if (activeConversation) {
      fetchMessages()
    }
  }, [activeConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/chat/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    }
  }

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/chat?conversationId=${activeConversation}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return

    const conversation = conversations.find((c) => c.conversationId === activeConversation)
    if (!conversation) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient: conversation.otherUser._id,
          message: newMessage,
          type: "text",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([...messages, data.message])
        setNewMessage("")
        fetchConversations() // Update conversation list
      } else {
        toast.error("Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (url: string, filename: string) => {
    if (!activeConversation) return

    const conversation = conversations.find((c) => c.conversationId === activeConversation)
    if (!conversation) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient: conversation.otherUser._id,
          message: `Shared a file: ${filename}`,
          type: "file",
          attachments: [{ url, filename, type: "file" }],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([...messages, data.message])
        setShowFileUpload(false)
        fetchConversations()
      }
    } catch (error) {
      console.error("Error sending file:", error)
      toast.error("Failed to send file")
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user) return null

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-colors z-40"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Messages</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Conversations List */}
            <div
              className={`${activeConversation ? "w-1/3" : "w-full"} border-r border-gray-200 dark:border-gray-700 overflow-y-auto`}
            >
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <div
                    key={conversation.conversationId}
                    onClick={() => setActiveConversation(conversation.conversationId)}
                    className={`p-3 border-b border-gray-100 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      activeConversation === conversation.conversationId ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conversation.lastMessage.message}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              )}
            </div>

            {/* Messages */}
            {activeConversation && (
              <div className="flex-1 flex flex-col">
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${message.sender._id === user.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          message.sender._id === user.id
                            ? "bg-red-600 text-white"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white"
                        }`}
                      >
                        <p>{message.message}</p>
                        {message.attachments.length > 0 && (
                          <div className="mt-1">
                            {message.attachments.map((attachment, index) => (
                              <a
                                key={index}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline"
                              >
                                📎 {attachment.filename}
                              </a>
                            ))}
                          </div>
                        )}
                        <p className="text-xs opacity-75 mt-1">{formatTime(message.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowFileUpload(true)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-red-500 focus:border-red-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={loading || !newMessage.trim()}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Upload File</h3>
              <button
                onClick={() => setShowFileUpload(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <FileUpload onUpload={handleFileUpload} accept="image/*,audio/*,.pdf,.doc,.docx,.txt" type="general" />
          </div>
        </div>
      )}
    </>
  )
}
