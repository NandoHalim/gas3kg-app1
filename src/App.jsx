// ...imports tetap
export default function App(){
  const { user,initializing,signOut }=useAuth();
  const toast=useToast();
  const navigate=useNavigate();
  const push=(m,t='success')=>toast?.show?toast.show({type:t,message:m}):alert(m);
  const [stocks,setStocks]=useState({ISI:0,KOSONG:0});
  const [isAdmin,setIsAdmin]=useState(false);

  useEffect(()=>{let alive=true;(async()=>{try{
    const map=await DataService.loadStocks(); if(alive) setStocks(map);
  }catch(e){console.error(e)}})();
  const ch=supabase.channel('stocks-rt-app').on('postgres_changes',{event:'*',schema:'public',table:'stocks'},async()=>{
    try{ setStocks(await DataService.loadStocks()); }catch{}
  }).subscribe();
  return()=>{try{supabase.removeChannel(ch);}catch{};alive=false};},[]);

  useEffect(()=>{setIsAdmin(false)},[user]);

  const handleResetAll=async()=>{
    if(!confirm('Yakin reset SEMUA data (stok, log, sales)?')) return;
    try{
      const fresh=await DataService.resetAllData();
      setStocks(fresh);
      // ✅ Toast sukses reset
      toast?.show ? toast.show({type:'success', message:'🧹 Data berhasil direset'}) : alert('Data berhasil direset');
      navigate('/');
    }catch(e){
      // ❌ Toast gagal reset
      toast?.show ? toast.show({type:'error', message:`❌ ${e.message || 'Gagal mereset data'}`}) : alert(e.message || 'Gagal mereset data');
    }
  };

  if(initializing) return <div className='p-4'>Loading…</div>;
  if(!user) return <LoginView/>;

  return(
    <div className='min-h-screen flex flex-col bg-gray-50 text-gray-900'>
      <Header onLogout={signOut} onResetAll={handleResetAll} isAdmin={isAdmin}/>
      <div className="app-body">
        <Navigation/>
        <main style={{flex:1,padding:16}}>
          <Routes>
            <Route path='/' element={<DashboardView stocks={stocks}/>}/>
            <Route path='/stok' element={<StokView stocks={stocks} onSaved={setStocks} onCancel={()=>navigate('/')}/>}/>
            <Route path='/penjualan' element={<PenjualanView stocks={stocks} onSaved={setStocks} onCancel={()=>navigate('/')}/>}/>
            <Route path='/riwayat' element={<RiwayatView onCancel={()=>navigate('/')}/>}/>
          </Routes>
        </main>
      </div>
      <footer style={{padding:12,textAlign:'center',color:COLORS.secondary,background:'#fff',borderTop:'1px solid #e5e7eb'}}>
        © {new Date().getFullYear()} Gas 3KG Manager
      </footer>
    </div>
  );
}
