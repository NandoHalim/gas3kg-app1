import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useNavigate } from "react-router-dom";

export default function LoginView() {
  const { signInAnon } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [remember,setRemember] = useState(false);
  const [showPass,setShowPass] = useState(false);
  const [loading,setLoading] = useState(false);

  useEffect(()=>{
    const saved = localStorage.getItem("rememberEmail");
    if(saved){ setEmail(saved); setRemember(true); }
  },[]);

  const onSubmit = async (e)=>{
    e.preventDefault();
    setLoading(true);
    try{
      // sementara pakai anon; kalau mau email+password ganti fungsi di AuthContext
      await signInAnon();
      if(remember) localStorage.setItem("rememberEmail", email);
      else localStorage.removeItem("rememberEmail");
      toast.show({ type:"success", message:"Login berhasil" });
      navigate("/", { replace:true });
    }catch(err){
      toast.show({ type:"error", message: err?.message || "Login gagal" });
    }finally{
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#f8fafc"}}>
      <form onSubmit={onSubmit}
            style={{background:"#fff",padding:24,borderRadius:12,width:"100%",maxWidth:380,
                    boxShadow:"0 6px 16px rgba(0,0,0,.08)",display:"grid",gap:12}}>
        <h2 style={{margin:0,textAlign:"center"}}>🔐 Login</h2>

        <label>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
               placeholder="admin@mail.com" required
               style={{padding:"10px 12px",border:"1px solid #cbd5e1",borderRadius:8}}/>

        <label>Password</label>
        <div style={{display:"flex",gap:8}}>
          <input type={showPass?"text":"password"} value={password}
                 onChange={e=>setPassword(e.target.value)}
                 placeholder="••••••" required
                 style={{flex:1,padding:"10px 12px",border:"1px solid #cbd5e1",borderRadius:8}}/>
          <button type="button" onClick={()=>setShowPass(v=>!v)}
                  style={{padding:"10px 12px",border:"1px solid #cbd5e1",borderRadius:8,background:"#f1f5f9"}}>
            {showPass ? "Hide" : "Show"}
          </button>
        </div>

        <label style={{display:"flex",alignItems:"center",gap:8}}>
          <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/>
          Ingat saya
        </label>

        <button type="submit" disabled={loading}
                style={{padding:"10px 12px",border:"1px solid #3b82f6",background:"#3b82f6",
                        color:"#fff",borderRadius:8,fontWeight:600}}>
          {loading ? "Loading..." : "Login"}
        </button>
      </form>
    </div>
  );
}
