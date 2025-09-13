import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state = { hasError:false, error:null };
  }
  static getDerivedStateFromError(error){
    return { hasError:true, error };
  }
  componentDidCatch(error, info){
    // optional: kirim ke log service
    console.error("ErrorBoundary caught:", error, info);
  }
  render(){
    if(this.state.hasError){
      return (
        <div style={{padding:24}}>
          <h2>Terjadi kesalahan saat memuat halaman</h2>
          <p style={{color:"#b91c1c"}}>{String(this.state.error?.message || this.state.error || "Unknown error")}</p>
          <button onClick={()=>location.reload()}>Muat ulang</button>
        </div>
      );
    }
    return this.props.children;
  }
}
