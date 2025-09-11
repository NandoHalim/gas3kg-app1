import React,{createContext,useContext,useState,useCallback} from 'react';
const Ctx=createContext(null);export const useToast=()=>useContext(Ctx);
export function ToastProvider({children}){const [toasts,set]=useState([]);const show=useCallback(({type='info',message})=>{const id=Math.random().toString(36).slice(2);set(t=>[...t,{id,type,message}]);setTimeout(()=>set(t=>t.filter(x=>x.id!==id)),3000)},[]);
  return (<Ctx.Provider value={{show}}>{children}<div style={{position:'fixed',right:16,bottom:16,display:'grid',gap:8}}>{toasts.map(t=>(<div key={t.id} className='card' style={{borderColor:'#cbd5e1'}}><div style={{fontWeight:600,marginBottom:4}}>{t.type.toUpperCase()}</div><div>{t.message}</div></div>))}</div></Ctx.Provider>);
}
