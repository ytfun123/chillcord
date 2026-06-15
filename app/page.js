"use client";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";

export default function Home() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const getCleanUsername = (emailAddress) => {
    return emailAddress ? emailAddress.split("@")[0] : "";
  };

  const handleSignUp = async () => {
    if (!username.trim() || !password.trim()) return alert("Please fill out all fields.");
    if (username.includes(" ")) return alert("Usernames cannot contain spaces.");
    
    const dynamicEmail = `${username.trim().toLowerCase()}@app.internal`;
    
    try {
      await createUserWithEmailAndPassword(auth, dynamicEmail, password);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogIn = async () => {
    if (!username.trim() || !password.trim()) return alert("Please fill out all fields.");
    
    const dynamicEmail = `${username.trim().toLowerCase()}@app.internal`;
    
    try {
      await signInWithEmailAndPassword(auth, dynamicEmail, password);
    } catch (err) {
      alert(err.message);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      await addDoc(collection(db, "messages"), {
        sender: getCleanUsername(user.email),
        text: inputText,
        createdAt: serverTimestamp(),
      });
      setInputText("");
    } catch (err) {
      console.error("Error writing message: ", err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-600 font-medium">Loading chat app...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4 text-center text-gray-800">In-App Texting Platform</h2>
          <input type="text" placeholder="Username" className="border w-full p-2 mb-3 rounded text-gray-800 outline-none focus:border-blue-500" onChange={(e) => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" className="border w-full p-2 mb-4 rounded text-gray-800 outline-none focus:border-blue-500" onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleLogIn} className="bg-blue-600 text-white w-full py-2 rounded mb-2 font-medium hover:bg-blue-700">Log In</button>
          <button onClick={handleSignUp} className="border border-blue-600 text-blue-600 w-full py-2 rounded font-medium hover:bg-blue-50">Create Account</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg flex flex-col h-[500px]">
        <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white rounded-t-lg">
          <span className="font-semibold text-sm truncate max-w-[250px]">User: {getCleanUsername(user.email)}</span>
          <button onClick={() => signOut(auth)} className="text-xs bg-red-500 px-3 py-1 rounded font-medium hover:bg-red-600">Log Out</button>
        </div>
        
        <div ref={chatBoxRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === getCleanUsername(user.email) ? "items-end" : "items-start"}`}>
              <span className="text-[10px] text-gray-400 mb-0.5 px-1">{msg.sender}</span>
              <div className={`p-2.5 rounded-lg text-sm max-w-[80%] break-words ${msg.sender === getCleanUsername(user.email) ? "bg-blue-600 text-white" : "bg-white text-gray-800 shadow-sm border border-gray-100"}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} className="p-3 border-t bg-white flex gap-2 rounded-b-lg">
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type an instant message..." className="flex-1 border p-2 rounded text-sm outline-none text-gray-800 focus:border-blue-500" />
          <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-semibold hover:bg-blue-700">Send</button>
        </form>
      </div>
    </div>
  );
}
