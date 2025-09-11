import React,{createContext,useContext,useEffect,useState} from 'react';
import { supabase } from '../lib/supabase';
const Ctx=createContext({user:null,initializing:true});
export const useAuth=()=>useContext(Ctx);
export function AuthProvider({children}){
  const [user,setUser]=useState(null);const [initializing,setInit]=useState(true);
  useEffect(()=>{let m=true;(async()=>{const {data}=await supabase.auth.getUser();if(m) setUser(data?.user??null);setInit(false)})();
    const { data:sub }=supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user??null));return()=>sub?.subscription?.unsubscribe?.();},[]);
  return <Ctx.Provider value={{user,initializing,async signInAnon(){const {data,error}=await supabase.auth.signInAnonymously();if(error) throw error;setUser(data?.user??null);},async signOut(){await supabase.auth.signOut();setUser(null);} }}>{children}</Ctx.Provider>;
}
