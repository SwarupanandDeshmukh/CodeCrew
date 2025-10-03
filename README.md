# 💬 ChitChat-with-AI

**ChitChat-with-AI** is a **MERN-based chat application** where users can chat with each other and also interact with an integrated **AI assistant** — directly inside their conversations.  

What makes this project unique is that the **AI can generate a basic Express.js server and execute it directly in the browser using WebContainers.**

---

## 🚀 Features
- 👥 **Real-time Chat** – Connect with other users in an interactive chat interface.  
- 🤖 **AI Assistant** – Ask questions or generate useful code in between your chats.  
- ⚡ **Express Server in Browser** – Thanks to **WebContainers**, the AI can create and run an Express server inside your browser itself.  
- 🎨 **Modern UI** – Clean and responsive interface built with **Tailwind CSS**.  
- 🔒 **Secure** – `.env` files are used for environment variables (API keys, DB connection strings, etc.), kept out of version control.  
- 🛠️ **MERN Architecture** – Full-stack app using MongoDB, Express, React, and Node.js.  

---

## 🏗️ Tech Stack
### Frontend
- React  
- Tailwind CSS  
- Socket.io (for chat)  
- WebContainers (for running backend server code in browser)

### Backend
- Node.js + Express.js  
- MongoDB (for storing chat history & user data)  
- Socket.io (real-time communication)  
- AI API integration (OpenAI / other LLM API)  

---


---

## ⚙️ Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/SwarupanandDeshmukh/ChitChat-with-AI.git
cd ChitChat-with-AI
```

2. **Setup Frontend**
```bash
cd frontend
npm install
npm run dev
```

3. **Setup Backend**
```bash
cd backend
npm install
npm run dev
```
