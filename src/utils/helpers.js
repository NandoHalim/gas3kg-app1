import { HARD_MAX_DATE } from './constants';
export const todayStr=()=>{const d=new Date();const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
export const maxAllowedDate=()=>{const t=todayStr();return t>HARD_MAX_DATE?HARD_MAX_DATE:t};
export const fmtIDR=(n)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
