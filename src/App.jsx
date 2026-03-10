import { useState, useEffect, useRef, useCallback } from "react";
import {
  db, collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, onSnapshot, query, orderBy, addDoc, updateDoc, serverTimestamp
} from "./firebase.js";

// ===== CONFIG =====
const TC = "wonju3101", CN = "원주고 3-1", CF = "원주고등학교 3학년 1반", MX = 31;
const korOk = /^[가-힣]{2,4}$/;
const bad = ["바보","멍청","시발","씨발","ㅅㅂ","ㅂㅅ","지랄","병신","새끼","ㅈㄹ","섹스","죽어","찐따"];
const validN = n => korOk.test(n) && !bad.some(b => n.includes(b));
const COLORS = ["#6366f1","#f43f5e","#0ea5e9","#10b981","#f59e0b","#8b5cf6","#ec4899","#14b8a6","#ef4444","#3b82f6","#22c55e","#a855f7","#06b6d4","#eab308","#e11d48","#7c3aed","#0d9488","#dc2626","#2563eb","#16a34a","#9333ea","#0891b2","#ca8a04","#be123c","#6d28d9","#059669","#b91c1c","#1d4ed8","#15803d","#7e22ce","#0e7490"];

// ===== ICONS (SVG) =====
const I = {
  home: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  chat: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  board: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  game: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="16" cy="10" r="1" fill="currentColor"/><circle cx="18" cy="14" r="1" fill="currentColor"/></svg>,
  more: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg>,
  send: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  img: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  pin: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M16 2v4l2 2-4 4h6l-2 2-4 4 2 2H8l4-4-4-4-2 2V8l4 4 4-4-2-2z"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  del: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  heart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

// ===== UTILS =====
const fT = iso => { if(!iso) return ""; const d=new Date(iso),h=d.getHours(),m=d.getMinutes().toString().padStart(2,"0"); return `${h>=12?"오후":"오전"} ${h>12?h-12:h===0?12:h}:${m}`; };
const fD = iso => { if(!iso) return ""; const d=new Date(iso); return `${d.getFullYear()}.${(d.getMonth()+1).toString().padStart(2,"0")}.${d.getDate().toString().padStart(2,"0")}`; };
const sameD = (a,b)=>a&&b&&new Date(a).toDateString()===new Date(b).toDateString();
const isT2 = iso=>iso&&new Date(iso).toDateString()===new Date().toDateString();
const dmK = (a,b)=>[a,b].sort().join("__");
const ago = iso => { const s=Math.floor((Date.now()-new Date(iso))/1000); if(s<60) return "방금"; if(s<3600) return `${Math.floor(s/60)}분 전`; if(s<86400) return `${Math.floor(s/3600)}시간 전`; return `${Math.floor(s/86400)}일 전`; };

// Avatar component
const Av = ({src,name,color,size=38}) => src ? (
  <img src={src} style={{width:size,height:size,borderRadius:size*0.3,objectFit:"cover"}} alt="" />
) : (
  <div style={{width:size,height:size,borderRadius:size*0.3,background:color||"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.4,fontWeight:700,color:"#fff",flexShrink:0}}>{name?.[0]||"?"}</div>
);

export default function App() {
  // ===== STATE =====
  const [pg, setPg] = useState("login");
  const [U, setU] = useState({});
  const [me, setMe] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [dms, setDms] = useState({});
  const [anns, setAnns] = useState([]);
  const [posts, setPosts] = useState([]);
  const [recruits, setRecruits] = useState([]);
  const [gameReqs, setGameReqs] = useState([]);
  const [tab, setTab] = useState("home");
  const [sub, setSub] = useState(null);
  const [err, setErr] = useState("");
  const [suc, setSuc] = useState("");
  // Auth
  const [lN,setLN]=useState(""); const [lP,setLP]=useState("");
  const [rN,setRN]=useState(""); const [rNm,setRNm]=useState(""); const [rP,setRP]=useState(""); const [rPC,setRPC]=useState(""); const [rR,setRR]=useState("student"); const [rC,setRC]=useState("");
  const [rsN,setRsN]=useState(""); const [rsNm,setRsNm]=useState(""); const [rsP,setRsP]=useState(""); const [rsPC,setRsPC]=useState("");
  // Chat
  const [chatIn,setChatIn]=useState(""); const [dmTgt,setDmTgt]=useState(null); const [dmIn,setDmIn]=useState("");
  // Board
  const [selAnn,setSelAnn]=useState(null); const [selPost,setSelPost]=useState(null); const [selRec,setSelRec]=useState(null);
  const [newAnn,setNewAnn]=useState(false); const [newPost,setNewPost]=useState(false); const [newRec,setNewRec]=useState(false);
  const [aT,setAT]=useState(""); const [aC,setAC]=useState(""); const [aPin,setAPin]=useState(false);
  const [pT,setPT]=useState(""); const [pC,setPC]=useState(""); const [pImg,setPImg]=useState(null);
  const [recT,setRecT]=useState(""); const [recC,setRecC]=useState(""); const [recMax,setRecMax]=useState("5");
  const [cmtIn,setCmtIn]=useState("");
  // Game
  const [gameType,setGameType]=useState(null); const [gameOpp,setGameOpp]=useState(null);
  const [wordChain,setWordChain]=useState([]); const [wordIn,setWordIn]=useState("");
  const [omBoard,setOmBoard]=useState(null); const [omTurn,setOmTurn]=useState(1);
  // More
  const [moreTab,setMoreTab]=useState("profile"); const [editPf,setEditPf]=useState(false); const [stIn,setStIn]=useState("");
  // UI
  const [loaded,setLoaded]=useState(false); const [anim,setAnim]=useState(false);
  const [boardTab,setBoardTab]=useState("notice"); const [chatMode,setChatMode]=useState("group");
  const chatEnd=useRef(null); const dmEnd=useRef(null); const fileRef=useRef(null); const pfRef=useRef(null);

  // ===== FIRESTORE REAL-TIME =====
  const toIso = ts => ts?.toDate ? ts.toDate().toISOString() : (ts || new Date().toISOString());

  // Session from localStorage
  useEffect(()=>{
    try{const s=localStorage.getItem("w31-session");if(s){setMe(JSON.parse(s));setPg("main");}}catch{}
    setLoaded(true);setTimeout(()=>setAnim(true),100);
  },[]);

  // Users listener
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"users"),snap=>{
      const obj={};snap.forEach(d=>{obj[d.id]={id:d.id,...d.data()};});setU(obj);
    });return()=>unsub();
  },[]);

  // Messages listener
  useEffect(()=>{
    const q=query(collection(db,"messages"),orderBy("createdAt","asc"));
    const unsub=onSnapshot(q,snap=>{
      setMsgs(snap.docs.map(d=>({id:d.id,...d.data(),time:toIso(d.data().createdAt)})));
    });return()=>unsub();
  },[]);

  // Announcements listener
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"announcements"),snap=>{
      setAnns(snap.docs.map(d=>({id:d.id,...d.data(),date:toIso(d.data().createdAt)})));
    });return()=>unsub();
  },[]);

  // Posts listener
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"posts"),snap=>{
      setPosts(snap.docs.map(d=>({id:d.id,...d.data(),date:toIso(d.data().createdAt)})));
    });return()=>unsub();
  },[]);

  // Recruits listener
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"recruits"),snap=>{
      setRecruits(snap.docs.map(d=>({id:d.id,...d.data(),date:toIso(d.data().createdAt)})));
    });return()=>unsub();
  },[]);

  // Game requests listener
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"gameReqs"),snap=>{
      setGameReqs(snap.docs.map(d=>({id:d.id,...d.data(),date:toIso(d.data().createdAt)})));
    });return()=>unsub();
  },[]);

  // DMs listener (for current DM conversation)
  useEffect(()=>{
    if(!me) return;
    const unsub=onSnapshot(collection(db,"dmRooms"),snap=>{
      snap.forEach(d=>{
        const data=d.data();
        if(data.participants?.includes(me.id)){
          const q2=query(collection(db,"dms",d.id,"messages"),orderBy("createdAt","asc"));
          onSnapshot(q2,mSnap=>{
            const arr=mSnap.docs.map(m=>({id:m.id,...m.data(),time:toIso(m.data().createdAt)}));
            setDms(prev=>({...prev,[d.id]:arr}));
          });
        }
      });
    });return()=>unsub();
  },[me?.id]);

  // Sync me with latest user data
  useEffect(()=>{
    if(me&&U[me.id]&&JSON.stringify(U[me.id])!==JSON.stringify(me)){
      setMe(U[me.id]);localStorage.setItem("w31-session",JSON.stringify(U[me.id]));
    }
  },[U]);

  // Firestore write helpers
  const svU=async v=>{for(const[id,u]of Object.entries(v)){await setDoc(doc(db,"users",id),{...u});}};
  const svS=async u=>{setMe(u);localStorage.setItem("w31-session",JSON.stringify(u));};

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[msgs,tab,chatMode]);
  useEffect(()=>{dmEnd.current?.scrollIntoView({behavior:"smooth"});},[dms,dmTgt]);

  const clr=()=>{setErr("");setSuc("");};
  const taken=Object.values(U).filter(u=>u.role==="student").map(u=>parseInt(u.num));
  const isT=me?.role==="teacher";
  const members=Object.values(U);
  const students=members.filter(m=>m.role==="student").sort((a,b)=>parseInt(a.num)-parseInt(b.num));
  const teachers=members.filter(m=>m.role==="teacher");
  const dday=(()=>{const d=Math.ceil((new Date("2026-11-19")-new Date())/864e5);return d>0?d:0;})();

  // ===== AUTH =====
  const doReg=async()=>{
    clr();
    if(rR==="student"){if(!rN)return setErr("번호를 선택해주세요.");const n=parseInt(rN);if(n<1||n>MX)return setErr(`1~${MX}번만 가능`);if(taken.includes(n))return setErr(`${n}번은 이미 등록됨`);}
    if(!rNm)return setErr("이름을 입력해주세요.");if(!validN(rNm))return setErr("한글 2~4자 본명만 가능");
    if(!rP||rP.length<4)return setErr("비밀번호 4자 이상");if(rP!==rPC)return setErr("비밀번호 불일치");
    if(rR==="teacher"&&rC!==TC)return setErr("인증 코드 오류");
    const id=rR==="teacher"?`t_${Date.now()}`:`s_${rN}`;
    const existing=await getDoc(doc(db,"users",id));if(existing.exists())return setErr("이미 등록된 번호");
    const u={num:rR==="student"?rN:"T",name:rNm,password:rP,role:rR,color:COLORS[parseInt(rN||"0")%COLORS.length],photo:null,status:"",joinDate:new Date().toISOString()};
    await setDoc(doc(db,"users",id),u);
    await addDoc(collection(db,"messages"),{sender:"시스템",senderId:"system",text:`${rNm}님이 합류했습니다`,type:"system",createdAt:serverTimestamp()});
    setSuc("가입 완료!");setRN("");setRNm("");setRP("");setRPC("");setRC("");
    setTimeout(()=>{setPg("login");clr();},1000);
  };
  const doLogin=async()=>{
    clr();if(!lN||!lP)return setErr("번호와 비밀번호를 입력하세요");
    const u=Object.values(U).find(u=>u.role==="student"?u.num===lN:u.name===lN);
    if(!u)return setErr("등록되지 않은 번호");if(u.password!==lP)return setErr("비밀번호 오류");
    await svS(u);setPg("main");setLN("");setLP("");
  };
  const doReset=async()=>{
    clr();if(!rsN||!rsNm)return setErr("번호와 이름 입력");if(!rsP||rsP.length<4)return setErr("새 비밀번호 4자 이상");if(rsP!==rsPC)return setErr("비밀번호 불일치");
    const u=Object.values(U).find(u=>u.num===rsN&&u.name===rsNm);if(!u)return setErr("일치하는 계정 없음");
    await updateDoc(doc(db,"users",u.id),{password:rsP});setSuc("비밀번호 변경됨");
    setRsN("");setRsNm("");setRsP("");setRsPC("");setTimeout(()=>{setPg("login");clr();},1000);
  };
  const logout=()=>{setMe(null);setPg("login");localStorage.removeItem("w31-session");};

  // ===== CHAT =====
  const sendMsg=async()=>{if(!chatIn.trim())return;
    await addDoc(collection(db,"messages"),{sender:me.name,senderId:me.id,text:chatIn.trim(),type:"user",role:me.role,color:me.color,photo:me.photo,num:me.num,createdAt:serverTimestamp()});
    setChatIn("");};
  const sendDm=async()=>{if(!dmIn.trim()||!dmTgt)return;const k=dmK(me.id,dmTgt.id);
    await setDoc(doc(db,"dmRooms",k),{participants:[me.id,dmTgt.id],lastTime:serverTimestamp()},{merge:true});
    await addDoc(collection(db,"dms",k,"messages"),{sender:me.name,senderId:me.id,text:dmIn.trim(),color:me.color,photo:me.photo,createdAt:serverTimestamp()});
    setDmIn("");};

  // ===== BOARD =====
  const postAnn=async()=>{if(!aT.trim()||!aC.trim())return setErr("제목과 내용 입력");
    await addDoc(collection(db,"announcements"),{title:aT.trim(),content:aC.trim(),author:me.name,authorId:me.id,pinned:aPin,comments:[],createdAt:serverTimestamp()});
    await addDoc(collection(db,"messages"),{sender:"시스템",senderId:"system",text:`📌 새 공지: "${aT.trim()}"`,type:"system",createdAt:serverTimestamp()});
    setAT("");setAC("");setAPin(false);setNewAnn(false);clr();};
  const postFree=async()=>{if(!pT.trim()||!pC.trim())return setErr("제목과 내용 입력");
    await addDoc(collection(db,"posts"),{title:pT.trim(),content:pC.trim(),author:me.name,authorId:me.id,image:pImg||null,likes:[],comments:[],color:me.color,photo:me.photo,num:me.num,createdAt:serverTimestamp()});
    setPT("");setPC("");setPImg(null);setNewPost(false);clr();};
  const postRecruit=async()=>{if(!recT.trim()||!recC.trim())return setErr("제목과 내용 입력");
    await addDoc(collection(db,"recruits"),{title:recT.trim(),content:recC.trim(),author:me.name,authorId:me.id,maxMembers:parseInt(recMax)||5,members:[{id:me.id,name:me.name}],closed:false,createdAt:serverTimestamp()});
    setRecT("");setRecC("");setRecMax("5");setNewRec(false);clr();};

  const addCmt=async(type,itemId)=>{if(!cmtIn.trim())return;const c={id:Date.now().toString(),author:me.name,authorId:me.id,text:cmtIn.trim(),date:new Date().toISOString(),color:me.color,photo:me.photo};
    const col=type==="ann"?"announcements":"posts";
    const ref=doc(db,col,itemId);const snap=await getDoc(ref);const cur=snap.data()?.comments||[];
    await updateDoc(ref,{comments:[...cur,c]});
    if(type==="ann")setSelAnn(p=>({...p,comments:[...p.comments,c]}));
    else setSelPost(p=>({...p,comments:[...p.comments,c]}));
    setCmtIn("");};
  const toggleLike=async(pid)=>{const ref=doc(db,"posts",pid);const snap=await getDoc(ref);const cur=snap.data()?.likes||[];
    const newL=cur.includes(me.id)?cur.filter(x=>x!==me.id):[...cur,me.id];
    await updateDoc(ref,{likes:newL});if(selPost?.id===pid)setSelPost(p=>({...p,likes:newL}));};
  const joinRecruit=async(rid)=>{const ref=doc(db,"recruits",rid);const snap=await getDoc(ref);const d=snap.data();
    if(d.members.some(m=>m.id===me.id)||d.members.length>=d.maxMembers)return;
    const newM=[...d.members,{id:me.id,name:me.name}];
    await updateDoc(ref,{members:newM});setSelRec(p=>({...p,members:newM}));};
  const delAnn=async id=>{await deleteDoc(doc(db,"announcements",id));setSelAnn(null);};
  const delPost=async id=>{await deleteDoc(doc(db,"posts",id));setSelPost(null);};
  const delRec=async id=>{await deleteDoc(doc(db,"recruits",id));setSelRec(null);};

  // ===== IMAGE =====
  const handleImg=(e,cb)=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>cb(ev.target.result);r.readAsDataURL(f);};

  // ===== PROFILE =====
  const updatePhoto=async(data)=>{await updateDoc(doc(db,"users",me.id),{photo:data});const u={...me,photo:data};await svS(u);};
  const updateSt=async()=>{await updateDoc(doc(db,"users",me.id),{status:stIn});const u={...me,status:stIn};await svS(u);setEditPf(false);};

  // ===== ADMIN =====
  const adminResetPw=async(uid,pw)=>{if(!pw||pw.length<4)return;await updateDoc(doc(db,"users",uid),{password:pw});};
  const adminRemove=async uid=>{const u=U[uid];if(!u)return;await deleteDoc(doc(db,"users",uid));
    await addDoc(collection(db,"messages"),{sender:"시스템",senderId:"system",text:`❌ ${u.name}님이 퇴장되었습니다`,type:"system",createdAt:serverTimestamp()});};
  const adminDelPost=async id=>{await deleteDoc(doc(db,"posts",id));};

  // ===== GAMES =====
  const sendGameReq=async(target,type)=>{
    await addDoc(collection(db,"gameReqs"),{from:me.id,fromName:me.name,to:target.id,toName:target.name,type,status:"pending",createdAt:serverTimestamp()});
  };
  const acceptGame=async(reqId)=>{
    await updateDoc(doc(db,"gameReqs",reqId),{status:"accepted"});
    const req=gameReqs.find(r=>r.id===reqId);
    if(req.type==="word"){setGameType("word");setGameOpp(U[req.from]);setWordChain([]);setSub("playing");}
    else if(req.type==="omok"){setGameType("omok");setGameOpp(U[req.from]);setOmBoard(Array(15).fill(null).map(()=>Array(15).fill(0)));setOmTurn(1);setSub("playing");}
  };
  const declineGame=async(reqId)=>{await updateDoc(doc(db,"gameReqs",reqId),{status:"declined"});};

  // 끝말잇기
  const submitWord=async()=>{
    if(!wordIn.trim())return;const w=wordIn.trim();
    if(wordChain.length>0){const last=wordChain[wordChain.length-1].word;if(w[0]!==last[last.length-1])return setErr(`"${last[last.length-1]}"(으)로 시작해야 합니다`);}
    if(wordChain.some(x=>x.word===w))return setErr("이미 사용된 단어입니다");
    clr();setWordChain([...wordChain,{word:w,player:me.name}]);setWordIn("");
  };

  // 오목
  const placeStone=(r,c)=>{if(!omBoard||omBoard[r][c]!==0)return;const b=omBoard.map(row=>[...row]);b[r][c]=omTurn;setOmBoard(b);
    if(checkWin(b,r,c,omTurn)){setTimeout(()=>alert(`${omTurn===1?"흑":"백"} 승리!`),100);return;}
    setOmTurn(omTurn===1?2:1);
  };
  const checkWin=(b,r,c,p)=>{const dirs=[[0,1],[1,0],[1,1],[1,-1]];for(const[dr,dc]of dirs){let cnt=1;for(let i=1;i<5;i++){const nr=r+dr*i,nc=c+dc*i;if(nr<0||nr>=15||nc<0||nc>=15||b[nr][nc]!==p)break;cnt++;}for(let i=1;i<5;i++){const nr=r-dr*i,nc=c-dc*i;if(nr<0||nr>=15||nc<0||nc>=15||b[nr][nc]!==p)break;cnt++;}if(cnt>=5)return true;}return false;};

  // ===== RENDER HELPERS =====
  const sortA=[...anns].sort((a,b)=>{if(a.pinned&&!b.pinned)return-1;if(!a.pinned&&b.pinned)return 1;return new Date(b.date)-new Date(a.date);});
  const myReqs=gameReqs.filter(r=>r.to===me?.id&&r.status==="pending");
  const dmPartners=Object.entries(dms).filter(([k])=>k.includes(me?.id)).map(([k,v])=>{const o=k.split("__").find(x=>x!==me?.id);return{key:k,partner:U[o],msgs:v};}).filter(d=>d.partner&&d.msgs.length>0);

  if(!loaded)return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#fff"}}><div style={{textAlign:"center"}}><div style={{width:48,height:48,border:"3px solid #e2e8f0",borderTopColor:"#6366f1",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}} /><p style={{color:"#94a3b8",fontSize:14}}>불러오는 중...</p></div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  // ==================== AUTH ====================
  if(pg!=="main")return(
    <div style={{minHeight:"100vh",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Pretendard',-apple-system,sans-serif"}}>
      <style>{`input:focus{border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.1)!important}select:focus{border-color:#6366f1!important}::placeholder{color:#94a3b8!important}`}</style>
      <div style={{width:"100%",maxWidth:380,opacity:anim?1:0,transform:anim?"translateY(0)":"translateY(16px)",transition:"all 0.4s ease"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,borderRadius:16,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
            <span style={{fontSize:28,color:"#fff",fontWeight:900}}>3-1</span>
          </div>
          <h1 style={{fontSize:22,fontWeight:800,color:"#1e293b",margin:"8px 0 4px"}}>{CN}</h1>
          <p style={{fontSize:13,color:"#94a3b8",margin:0}}>{CF}</p>
          <div style={{display:"inline-block",marginTop:8,padding:"4px 12px",borderRadius:20,background:"#fef3c7",fontSize:12,fontWeight:600,color:"#d97706"}}>수능 D-{dday}</div>
        </div>

        {err&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,padding:"10px 14px",color:"#dc2626",fontSize:13,marginBottom:12,textAlign:"center"}}>{err}</div>}
        {suc&&<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"10px 14px",color:"#16a34a",fontSize:13,marginBottom:12,textAlign:"center"}}>{suc}</div>}

        {pg==="login"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label style={S.lb}>번호</label><input style={S.in} placeholder="학생: 1~31 / 선생님: 이름" value={lN} onChange={e=>setLN(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()} /></div>
          <div><label style={S.lb}>비밀번호</label><input style={S.in} type="password" placeholder="비밀번호" value={lP} onChange={e=>setLP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()} /></div>
          <button style={S.btn} onClick={doLogin}>로그인</button>
          <div style={{textAlign:"center",fontSize:13,color:"#94a3b8",marginTop:4}}><span style={{color:"#6366f1",cursor:"pointer"}} onClick={()=>{setPg("register");clr();}}>회원가입</span><span style={{margin:"0 8px"}}>·</span><span style={{color:"#6366f1",cursor:"pointer"}} onClick={()=>{setPg("reset");clr();}}>비밀번호 찾기</span></div>
        </div>}

        {pg==="register"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",gap:8}}><button style={rR==="student"?S.rsA:S.rsI} onClick={()=>setRR("student")}>학생</button><button style={rR==="teacher"?{...S.rsA,background:"#f43f5e"}:S.rsI} onClick={()=>setRR("teacher")}>선생님</button></div>
          {rR==="student"&&<div><label style={S.lb}>번호</label><select style={S.in} value={rN} onChange={e=>setRN(e.target.value)}><option value="">선택</option>{Array.from({length:MX},(_,i)=>i+1).map(n=><option key={n} value={String(n)} disabled={taken.includes(n)}>{n}번{taken.includes(n)?" (등록됨)":""}</option>)}</select></div>}
          <div><label style={S.lb}>이름 <span style={{color:"#f43f5e",fontSize:11}}>한글 2~4자 본명</span></label><input style={S.in} placeholder="홍길동" value={rNm} onChange={e=>setRNm(e.target.value)} maxLength={4} /></div>
          <div style={{display:"flex",gap:8}}><div style={{flex:1}}><label style={S.lb}>비밀번호</label><input style={S.in} type="password" placeholder="4자 이상" value={rP} onChange={e=>setRP(e.target.value)} /></div><div style={{flex:1}}><label style={S.lb}>확인</label><input style={S.in} type="password" placeholder="재입력" value={rPC} onChange={e=>setRPC(e.target.value)} /></div></div>
          {rR==="teacher"&&<div><label style={S.lb}>인증 코드</label><input style={S.in} type="password" placeholder="인증 코드" value={rC} onChange={e=>setRC(e.target.value)} /></div>}
          <button style={S.btn} onClick={doReg}>가입하기</button>
          <p style={{textAlign:"center",fontSize:13}}><span style={{color:"#6366f1",cursor:"pointer"}} onClick={()=>{setPg("login");clr();}}>← 로그인으로</span></p>
        </div>}

        {pg==="reset"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
          <p style={{fontSize:13,color:"#64748b",textAlign:"center",margin:0}}>번호와 이름으로 본인 확인</p>
          <div><label style={S.lb}>번호</label><input style={S.in} value={rsN} onChange={e=>setRsN(e.target.value)} /></div>
          <div><label style={S.lb}>이름</label><input style={S.in} value={rsNm} onChange={e=>setRsNm(e.target.value)} /></div>
          <div style={{display:"flex",gap:8}}><div style={{flex:1}}><label style={S.lb}>새 비밀번호</label><input style={S.in} type="password" value={rsP} onChange={e=>setRsP(e.target.value)} /></div><div style={{flex:1}}><label style={S.lb}>확인</label><input style={S.in} type="password" value={rsPC} onChange={e=>setRsPC(e.target.value)} /></div></div>
          <button style={S.btn} onClick={doReset}>변경</button>
          <p style={{textAlign:"center",fontSize:13}}><span style={{color:"#6366f1",cursor:"pointer"}} onClick={()=>{setPg("login");clr();}}>← 로그인으로</span></p>
        </div>}
      </div>
    </div>
  );

  // ==================== MAIN APP ====================
  return(
    <div style={{height:"100vh",height:"100dvh",display:"flex",flexDirection:"column",background:"#f8fafc",fontFamily:"'Pretendard',-apple-system,sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        *::-webkit-scrollbar{width:4px}*::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px}
        button{transition:all 0.12s!important;cursor:pointer!important}button:active{transform:scale(0.97)}
        input:focus,textarea:focus{border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.08)!important;outline:none!important}
      `}</style>

      {/* HEADER */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:"#fff",borderBottom:"1px solid #f1f5f9"}}>
        {sub?<button style={{border:"none",background:"none",padding:0,color:"#64748b"}} onClick={()=>{setSub(null);setSelAnn(null);setSelPost(null);setSelRec(null);setDmTgt(null);setGameType(null);clr();}}>{I.back}</button>:<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff"}}>3-1</div><span style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>{CN}</span></div>}
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          {myReqs.length>0&&<div style={{width:8,height:8,borderRadius:4,background:"#f43f5e",position:"absolute",right:52,top:14}} />}
          <button style={{border:"none",background:"none",padding:4,color:"#64748b"}} onClick={()=>{setTab("more");setMoreTab("profile");setSub(null);}}>{I.user}</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>

        {/* ===== HOME ===== */}
        {tab==="home"&&!sub&&(
          <div style={{flex:1,overflowY:"auto",padding:16}}>
            {/* Welcome */}
            <div style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",borderRadius:16,padding:"20px 18px",marginBottom:16,color:"#fff"}}>
              <p style={{fontSize:12,opacity:0.8,margin:"0 0 2px"}}>안녕하세요!</p>
              <p style={{fontSize:18,fontWeight:800,margin:"0 0 4px"}}>{me.name}님 {isT?"선생님":""}👋</p>
              <p style={{fontSize:12,opacity:0.7,margin:0}}>{CF} · {isT?"담임":`${me.num}번`}</p>
            </div>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
              <div style={S.stat}><span style={{fontSize:22,fontWeight:800,color:"#6366f1"}}>{students.length}<span style={{fontSize:12,color:"#94a3b8"}}>/{MX}</span></span><span style={{fontSize:11,color:"#94a3b8"}}>학생</span></div>
              <div style={S.stat}><span style={{fontSize:22,fontWeight:800,color:"#f43f5e"}}>D-{dday}</span><span style={{fontSize:11,color:"#94a3b8"}}>수능</span></div>
              <div style={S.stat}><span style={{fontSize:22,fontWeight:800,color:"#0ea5e9"}}>{posts.length}</span><span style={{fontSize:11,color:"#94a3b8"}}>게시글</span></div>
            </div>

            {/* Game requests */}
            {myReqs.length>0&&<div style={{marginBottom:16}}>
              <h3 style={S.sh}>🎮 게임 요청</h3>
              {myReqs.map(r=>(
                <div key={r.id} style={{background:"#fff",borderRadius:12,padding:14,marginBottom:8,border:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><span style={{fontSize:14,fontWeight:600,color:"#1e293b"}}>{r.fromName}</span><span style={{fontSize:12,color:"#94a3b8",marginLeft:6}}>{r.type==="word"?"끝말잇기":"오목"}</span></div>
                  <div style={{display:"flex",gap:6}}><button style={{padding:"6px 14px",borderRadius:8,border:"none",background:"#6366f1",color:"#fff",fontSize:12,fontWeight:600}} onClick={()=>acceptGame(r.id)}>수락</button><button style={{padding:"6px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600}} onClick={()=>declineGame(r.id)}>거절</button></div>
                </div>
              ))}
            </div>}

            {/* Recent notice */}
            <h3 style={S.sh}>📌 최근 공지</h3>
            {sortA.slice(0,3).map(a=>(
              <div key={a.id} style={S.card} onClick={()=>{setTab("board");setBoardTab("notice");setSelAnn(a);setSub("detail");}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:14,fontWeight:600,color:"#1e293b"}}>{a.title}</span>
                  <span style={{fontSize:11,color:"#94a3b8"}}>{ago(a.date)}</span>
                </div>
              </div>
            ))}

            {/* Unregistered */}
            {(()=>{const u=Array.from({length:MX},(_,i)=>i+1).filter(n=>!taken.includes(n));return u.length>0?<div style={{marginTop:16}}><h3 style={S.sh}>미가입 번호 ({u.length}명)</h3><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{u.map(n=><span key={n} style={{padding:"4px 10px",borderRadius:8,background:"#fff",border:"1px solid #e2e8f0",color:"#64748b",fontSize:12,fontWeight:600}}>{n}번</span>)}</div></div>:null;})()}
          </div>
        )}

        {/* ===== CHAT ===== */}
        {tab==="chat"&&!sub&&(
          <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
            {/* Chat tabs */}
            <div style={{display:"flex",borderBottom:"1px solid #f1f5f9",background:"#fff"}}>
              <button style={chatMode==="group"?S.stA:S.stI} onClick={()=>setChatMode("group")}>단체</button>
              <button style={chatMode==="dm"?S.stA:S.stI} onClick={()=>setChatMode("dm")}>1:1</button>
            </div>

            {chatMode==="group"&&<>
              <div style={{flex:1,overflowY:"auto",padding:"12px 14px",background:"#f8fafc"}}>
                {msgs.map((m,i)=>{const isMe=m.senderId===me.id;const isSys=m.type==="system";const sd=i===0||!sameD(msgs[i-1].time,m.time);const ss=!isMe&&!isSys&&(i===0||msgs[i-1].senderId!==m.senderId||sd);
                return <div key={m.id}>{sd&&<div style={{textAlign:"center",margin:"14px 0 10px"}}><span style={{fontSize:11,color:"#94a3b8",background:"#fff",padding:"3px 12px",borderRadius:12,border:"1px solid #f1f5f9"}}>{isT2(m.time)?"오늘":fD(m.time)}</span></div>}
                {isSys?<div style={{textAlign:"center",margin:"8px 0"}}><span style={{fontSize:12,color:"#94a3b8"}}>{m.text}</span></div>:(
                <div style={{display:"flex",marginBottom:4,gap:8,justifyContent:isMe?"flex-end":"flex-start"}}>
                  {!isMe&&<div style={{width:34}}>{ss&&<Av src={m.photo} name={m.sender} color={m.color} size={34} />}</div>}
                  <div style={{maxWidth:"72%"}}>{ss&&!isMe&&<div style={{fontSize:11,fontWeight:600,color:"#64748b",marginBottom:2}}>{m.num?`${m.num}번 `:""}{m.sender}</div>}
                  <div style={{display:"flex",alignItems:"flex-end",gap:4,flexDirection:isMe?"row-reverse":"row"}}>
                    <div style={isMe?{background:"#6366f1",color:"#fff",padding:"8px 14px",borderRadius:"16px 16px 4px 16px",fontSize:14,lineHeight:1.5,wordBreak:"break-word"}:{background:"#fff",color:"#1e293b",padding:"8px 14px",borderRadius:"16px 16px 16px 4px",fontSize:14,lineHeight:1.5,wordBreak:"break-word",border:"1px solid #f1f5f9"}}>{m.text}</div>
                    <span style={{fontSize:10,color:"#94a3b8",flexShrink:0}}>{fT(m.time)}</span>
                  </div></div></div>)}</div>;})}
                <div ref={chatEnd} />
              </div>
              <div style={{display:"flex",gap:8,padding:"10px 14px",background:"#fff",borderTop:"1px solid #f1f5f9"}}>
                <input style={{flex:1,padding:"10px 14px",borderRadius:24,border:"1px solid #e2e8f0",background:"#f8fafc",fontSize:14,color:"#1e293b",outline:"none",fontFamily:"inherit"}} placeholder="메시지 입력..." value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}} />
                <button style={{width:40,height:40,borderRadius:20,border:"none",background:chatIn.trim()?"#6366f1":"#e2e8f0",color:chatIn.trim()?"#fff":"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={sendMsg}>{I.send}</button>
              </div>
            </>}

            {chatMode==="dm"&&!dmTgt&&<div style={{flex:1,overflowY:"auto",padding:16}}>
              <h3 style={{fontSize:15,fontWeight:700,color:"#1e293b",margin:"0 0 12px"}}>대화 상대 선택</h3>
              {members.filter(u=>u.id!==me.id).map(u=>(<div key={u.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#fff",borderRadius:12,marginBottom:6,border:"1px solid #f1f5f9",cursor:"pointer"}} onClick={()=>{setDmTgt(u);setSub("dm");}}>
                <Av src={u.photo} name={u.name} color={u.color} size={36} />
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:"#1e293b"}}>{u.role==="student"?`${u.num}번 `:""}{u.name}</div>{u.status&&<div style={{fontSize:11,color:"#94a3b8"}}>{u.status}</div>}</div>
              </div>))}
            </div>}

            {chatMode==="dm"&&dmTgt&&<>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#fff",borderBottom:"1px solid #f1f5f9"}}>
                <button style={{border:"none",background:"none",padding:0,color:"#64748b"}} onClick={()=>setDmTgt(null)}>{I.back}</button>
                <Av src={dmTgt.photo} name={dmTgt.name} color={dmTgt.color} size={32} />
                <span style={{fontSize:14,fontWeight:700,color:"#1e293b"}}>{dmTgt.name}</span>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"12px 14px",background:"#f8fafc"}}>
                {(dms[dmK(me.id,dmTgt.id)]||[]).map((m,i,arr)=>{const isMe=m.senderId===me.id;const sd=i===0||!sameD(arr[i-1].time,m.time);
                return <div key={m.id}>{sd&&<div style={{textAlign:"center",margin:"12px 0 8px"}}><span style={{fontSize:11,color:"#94a3b8",background:"#fff",padding:"2px 10px",borderRadius:10}}>{isT2(m.time)?"오늘":fD(m.time)}</span></div>}
                <div style={{display:"flex",marginBottom:4,justifyContent:isMe?"flex-end":"flex-start"}}><div style={{maxWidth:"75%"}}><div style={{display:"flex",alignItems:"flex-end",gap:4,flexDirection:isMe?"row-reverse":"row"}}><div style={isMe?{background:"#6366f1",color:"#fff",padding:"8px 14px",borderRadius:"16px 16px 4px 16px",fontSize:14}:{background:"#fff",color:"#1e293b",padding:"8px 14px",borderRadius:"16px 16px 16px 4px",fontSize:14,border:"1px solid #f1f5f9"}}>{m.text}</div><span style={{fontSize:10,color:"#94a3b8"}}>{fT(m.time)}</span></div></div></div></div>;})}
                <div ref={dmEnd} />
              </div>
              <div style={{display:"flex",gap:8,padding:"10px 14px",background:"#fff",borderTop:"1px solid #f1f5f9"}}>
                <input style={{flex:1,padding:"10px 14px",borderRadius:24,border:"1px solid #e2e8f0",background:"#f8fafc",fontSize:14,outline:"none",fontFamily:"inherit"}} placeholder={`${dmTgt.name}님에게...`} value={dmIn} onChange={e=>setDmIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();sendDm();}}} />
                <button style={{width:40,height:40,borderRadius:20,border:"none",background:dmIn.trim()?"#6366f1":"#e2e8f0",color:dmIn.trim()?"#fff":"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={sendDm}>{I.send}</button>
              </div>
            </>}
          </div>
        )}

        {/* ===== BOARD ===== */}
        {tab==="board"&&!sub&&(
          <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
            <div style={{display:"flex",borderBottom:"1px solid #f1f5f9",background:"#fff"}}>
              {[{k:"notice",l:"공지사항"},{k:"free",l:"자유게시판"},{k:"recruit",l:"모집"}].map(t=><button key={t.k} style={boardTab===t.k?S.stA:S.stI} onClick={()=>setBoardTab(t.k)}>{t.l}</button>)}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:16}}>
              {/* Notice */}
              {boardTab==="notice"&&<>
                {isT&&<button style={S.newBtn} onClick={()=>{setNewAnn(!newAnn);clr();}}>{newAnn?"닫기":"새 공지 작성"}</button>}
                {newAnn&&<div style={S.formBox}>{err&&<div style={S.errS}>{err}</div>}<input style={S.in} placeholder="제목" value={aT} onChange={e=>setAT(e.target.value)} /><textarea style={S.ta} placeholder="내용" value={aC} onChange={e=>setAC(e.target.value)} rows={4} /><label style={{fontSize:13,color:"#64748b",display:"flex",alignItems:"center",gap:6}}><input type="checkbox" checked={aPin} onChange={e=>setAPin(e.target.checked)} />상단 고정</label><button style={S.btn} onClick={postAnn}>게시</button></div>}
                {sortA.map(a=><div key={a.id} style={S.card} onClick={()=>{setSelAnn(a);setSub("detail");}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>{a.pinned&&<span style={{fontSize:10,color:"#6366f1",fontWeight:700,background:"#eef2ff",padding:"2px 6px",borderRadius:4}}>고정</span>}<span style={{fontSize:15,fontWeight:600,color:"#1e293b"}}>{a.title}</span></div><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#94a3b8"}}><span>{a.author} · {ago(a.date)}</span><span>💬 {a.comments?.length||0}</span></div></div>)}
              </>}

              {/* Free board */}
              {boardTab==="free"&&<>
                <button style={S.newBtn} onClick={()=>{setNewPost(!newPost);clr();}}>{newPost?"닫기":"글쓰기"}</button>
                {newPost&&<div style={S.formBox}>{err&&<div style={S.errS}>{err}</div>}<input style={S.in} placeholder="제목" value={pT} onChange={e=>setPT(e.target.value)} /><textarea style={S.ta} placeholder="오늘 하루 어땠나요? 자유롭게 공유해보세요!" value={pC} onChange={e=>setPC(e.target.value)} rows={4} />
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <button style={{display:"flex",alignItems:"center",gap:4,padding:"8px 14px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:13}} onClick={()=>fileRef.current?.click()}>{I.img} 사진 추가</button>
                    <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleImg(e,setPImg)} />
                    {pImg&&<img src={pImg} style={{width:40,height:40,borderRadius:8,objectFit:"cover"}} alt="" />}
                  </div>
                  <button style={S.btn} onClick={postFree}>게시</button></div>}
                {posts.map(p=><div key={p.id} style={S.card} onClick={()=>{setSelPost(p);setSub("detail");}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><Av src={p.photo} name={p.author} color={p.color} size={28} /><div><span style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{p.num?`${p.num}번 `:""}{p.author}</span><span style={{fontSize:11,color:"#94a3b8",marginLeft:6}}>{ago(p.date)}</span></div></div>
                  <h4 style={{fontSize:15,fontWeight:600,color:"#1e293b",margin:"0 0 4px"}}>{p.title}</h4>
                  <p style={{fontSize:13,color:"#64748b",margin:"0 0 8px",lineHeight:1.5}}>{p.content.slice(0,80)}{p.content.length>80?"...":""}</p>
                  {p.image&&<img src={p.image} style={{width:"100%",borderRadius:10,marginBottom:8,maxHeight:200,objectFit:"cover"}} alt="" />}
                  <div style={{display:"flex",gap:16,fontSize:12,color:"#94a3b8"}}><span style={{display:"flex",alignItems:"center",gap:3,color:(p.likes||[]).includes(me.id)?"#f43f5e":"#94a3b8"}}>{I.heart} {(p.likes||[]).length}</span><span>💬 {p.comments?.length||0}</span></div>
                </div>)}
              </>}

              {/* Recruit */}
              {boardTab==="recruit"&&<>
                <button style={S.newBtn} onClick={()=>{setNewRec(!newRec);clr();}}>{newRec?"닫기":"모집글 작성"}</button>
                {newRec&&<div style={S.formBox}>{err&&<div style={S.errS}>{err}</div>}<input style={S.in} placeholder="모집 제목 (예: 축구 동아리 모집)" value={recT} onChange={e=>setRecT(e.target.value)} /><textarea style={S.ta} placeholder="모집 내용" value={recC} onChange={e=>setRecC(e.target.value)} rows={3} /><div><label style={S.lb}>모집 인원</label><input style={S.in} type="number" value={recMax} onChange={e=>setRecMax(e.target.value)} min="2" max="31" /></div><button style={S.btn} onClick={postRecruit}>게시</button></div>}
                {recruits.map(r=><div key={r.id} style={S.card} onClick={()=>{setSelRec(r);setSub("detail");}}>
                  <h4 style={{fontSize:15,fontWeight:600,color:"#1e293b",margin:"0 0 6px"}}>{r.title}</h4>
                  <p style={{fontSize:13,color:"#64748b",margin:"0 0 8px"}}>{r.content.slice(0,60)}{r.content.length>60?"...":""}</p>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12,color:"#94a3b8"}}>{r.author} · {ago(r.date)}</span><span style={{fontSize:12,fontWeight:600,color:r.members.length>=r.maxMembers?"#f43f5e":"#6366f1"}}>{r.members.length}/{r.maxMembers}명</span></div>
                </div>)}
              </>}
            </div>
          </div>
        )}

        {/* Board Detail */}
        {tab==="board"&&sub==="detail"&&selAnn&&(
          <div style={{flex:1,overflowY:"auto",padding:16}}>
            <div style={{background:"#fff",borderRadius:14,padding:18,border:"1px solid #f1f5f9",marginBottom:14}}>
              {selAnn.pinned&&<span style={{fontSize:10,color:"#6366f1",fontWeight:700,background:"#eef2ff",padding:"2px 6px",borderRadius:4}}>고정</span>}
              <h2 style={{fontSize:18,fontWeight:800,color:"#1e293b",margin:"8px 0 10px"}}>{selAnn.title}</h2>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:14}}>{selAnn.author} · {fD(selAnn.date)}</div>
              <p style={{fontSize:14,lineHeight:1.8,color:"#475569",whiteSpace:"pre-wrap",margin:0}}>{selAnn.content}</p>
              {isT&&<button style={{marginTop:14,border:"1px solid #fecaca",background:"#fff",color:"#dc2626",padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}} onClick={()=>delAnn(selAnn.id)}>{I.del} 삭제</button>}
            </div>
            <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #f1f5f9"}}>
              <h4 style={{fontSize:14,fontWeight:700,color:"#1e293b",margin:"0 0 12px"}}>댓글 ({selAnn.comments?.length||0})</h4>
              {(selAnn.comments||[]).map(c=><div key={c.id} style={{padding:"10px 0",borderBottom:"1px solid #f8fafc"}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><Av src={c.photo} name={c.author} color={c.color} size={24} /><span style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{c.author}</span><span style={{fontSize:11,color:"#94a3b8"}}>{ago(c.date)}</span></div><p style={{margin:0,fontSize:13,color:"#475569",paddingLeft:30}}>{c.text}</p></div>)}
              <div style={{display:"flex",gap:8,marginTop:12}}><input style={{...S.in,flex:1,padding:"9px 14px"}} placeholder="댓글..." value={cmtIn} onChange={e=>setCmtIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCmt("ann",selAnn.id)} /><button style={{width:38,height:38,borderRadius:10,border:"none",background:"#6366f1",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>addCmt("ann",selAnn.id)}>{I.send}</button></div>
            </div>
          </div>
        )}

        {tab==="board"&&sub==="detail"&&selPost&&(
          <div style={{flex:1,overflowY:"auto",padding:16}}>
            <div style={{background:"#fff",borderRadius:14,padding:18,border:"1px solid #f1f5f9",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Av src={selPost.photo} name={selPost.author} color={selPost.color} size={36} /><div><span style={{fontSize:14,fontWeight:600,color:"#1e293b"}}>{selPost.num?`${selPost.num}번 `:""}{selPost.author}</span><div style={{fontSize:11,color:"#94a3b8"}}>{fD(selPost.date)}</div></div></div>
              <h2 style={{fontSize:18,fontWeight:800,color:"#1e293b",margin:"0 0 10px"}}>{selPost.title}</h2>
              <p style={{fontSize:14,lineHeight:1.8,color:"#475569",whiteSpace:"pre-wrap",margin:0}}>{selPost.content}</p>
              {selPost.image&&<img src={selPost.image} style={{width:"100%",borderRadius:12,marginTop:12}} alt="" />}
              <div style={{display:"flex",gap:16,marginTop:14}}>
                <button style={{display:"flex",alignItems:"center",gap:4,border:"none",background:"none",fontSize:14,fontWeight:600,color:(selPost.likes||[]).includes(me.id)?"#f43f5e":"#94a3b8",padding:0}} onClick={()=>toggleLike(selPost.id)}>{I.heart} {(selPost.likes||[]).length}</button>
              </div>
              {(selPost.authorId===me.id||isT)&&<button style={{marginTop:12,border:"1px solid #fecaca",background:"#fff",color:"#dc2626",padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}} onClick={()=>delPost(selPost.id)}>{I.del} 삭제</button>}
            </div>
            <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #f1f5f9"}}>
              <h4 style={{fontSize:14,fontWeight:700,margin:"0 0 12px"}}>댓글 ({selPost.comments?.length||0})</h4>
              {(selPost.comments||[]).map(c=><div key={c.id} style={{padding:"10px 0",borderBottom:"1px solid #f8fafc"}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><Av src={c.photo} name={c.author} color={c.color} size={24} /><span style={{fontSize:13,fontWeight:600}}>{c.author}</span><span style={{fontSize:11,color:"#94a3b8"}}>{ago(c.date)}</span></div><p style={{margin:0,fontSize:13,color:"#475569",paddingLeft:30}}>{c.text}</p></div>)}
              <div style={{display:"flex",gap:8,marginTop:12}}><input style={{...S.in,flex:1,padding:"9px 14px"}} placeholder="댓글..." value={cmtIn} onChange={e=>setCmtIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCmt("post",selPost.id)} /><button style={{width:38,height:38,borderRadius:10,border:"none",background:"#6366f1",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>addCmt("post",selPost.id)}>{I.send}</button></div>
            </div>
          </div>
        )}

        {tab==="board"&&sub==="detail"&&selRec&&(
          <div style={{flex:1,overflowY:"auto",padding:16}}>
            <div style={{background:"#fff",borderRadius:14,padding:18,border:"1px solid #f1f5f9"}}>
              <h2 style={{fontSize:18,fontWeight:800,color:"#1e293b",margin:"0 0 8px"}}>{selRec.title}</h2>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:14}}>{selRec.author} · {fD(selRec.date)}</div>
              <p style={{fontSize:14,lineHeight:1.8,color:"#475569",whiteSpace:"pre-wrap",margin:"0 0 16px"}}>{selRec.content}</p>
              <div style={{background:"#f8fafc",borderRadius:12,padding:14}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1e293b",marginBottom:10}}>참여 현황 ({selRec.members.length}/{selRec.maxMembers})</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{selRec.members.map(m=><span key={m.id} style={{padding:"4px 10px",borderRadius:8,background:"#eef2ff",color:"#6366f1",fontSize:12,fontWeight:600}}>{m.name}</span>)}</div>
                {!selRec.members.some(m=>m.id===me.id)&&selRec.members.length<selRec.maxMembers&&<button style={S.btn} onClick={()=>joinRecruit(selRec.id)}>참여하기</button>}
                {selRec.members.some(m=>m.id===me.id)&&<p style={{fontSize:13,color:"#6366f1",fontWeight:600}}>참여 중</p>}
              </div>
              {(selRec.authorId===me.id||isT)&&<button style={{marginTop:14,border:"1px solid #fecaca",background:"#fff",color:"#dc2626",padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}} onClick={()=>delRec(selRec.id)}>{I.del} 삭제</button>}
            </div>
          </div>
        )}

        {/* ===== GAME ===== */}
        {tab==="game"&&!sub&&(
          <div style={{flex:1,overflowY:"auto",padding:16}}>
            <h3 style={{fontSize:16,fontWeight:700,color:"#1e293b",margin:"0 0 14px"}}>미니게임</h3>
            {["끝말잇기","오목"].map((g,i)=>(
              <div key={g} style={{...S.card,display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:48,height:48,borderRadius:14,background:i===0?"linear-gradient(135deg,#10b981,#34d399)":"linear-gradient(135deg,#1e293b,#475569)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff",flexShrink:0}}>{i===0?"📝":"⚫"}</div>
                <div style={{flex:1}}><h4 style={{fontSize:15,fontWeight:700,color:"#1e293b",margin:"0 0 2px"}}>{g}</h4><p style={{fontSize:12,color:"#94a3b8",margin:0}}>{i===0?"끝 글자로 이어가기":"5개 먼저 놓으면 승리"}</p></div>
                <button style={{padding:"8px 14px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontSize:12,fontWeight:600}} onClick={()=>{setGameType(i===0?"word":"omok");setSub("invite");}}>시작</button>
              </div>
            ))}

            {/* Pending requests */}
            {myReqs.length>0&&<><h3 style={{...S.sh,marginTop:20}}>받은 요청</h3>
              {myReqs.map(r=><div key={r.id} style={{...S.card,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><span style={{fontSize:14,fontWeight:600}}>{r.fromName}</span><span style={{fontSize:12,color:"#94a3b8",marginLeft:6}}>{r.type==="word"?"끝말잇기":"오목"}</span></div>
                <div style={{display:"flex",gap:6}}><button style={{padding:"6px 14px",borderRadius:8,border:"none",background:"#6366f1",color:"#fff",fontSize:12,fontWeight:600}} onClick={()=>acceptGame(r.id)}>수락</button><button style={{padding:"6px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12}} onClick={()=>declineGame(r.id)}>거절</button></div>
              </div>)}</>}
          </div>
        )}

        {/* Game invite */}
        {tab==="game"&&sub==="invite"&&(
          <div style={{flex:1,overflowY:"auto",padding:16}}>
            <h3 style={{fontSize:16,fontWeight:700,color:"#1e293b",margin:"0 0 4px"}}>{gameType==="word"?"끝말잇기":"오목"}</h3>
            <p style={{fontSize:13,color:"#94a3b8",margin:"0 0 16px"}}>상대방을 선택하세요</p>
            {members.filter(u=>u.id!==me.id&&u.role==="student").map(u=>(
              <div key={u.id} style={{...S.card,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}><Av src={u.photo} name={u.name} color={u.color} size={36} /><span style={{fontSize:14,fontWeight:600}}>{u.num}번 {u.name}</span></div>
                <button style={{padding:"7px 16px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontSize:12,fontWeight:600}} onClick={()=>{sendGameReq(u,gameType);setSub(null);setSuc(`${u.name}님에게 요청을 보냈습니다`);}}>요청</button>
              </div>
            ))}
          </div>
        )}

        {/* Playing word chain */}
        {tab==="game"&&sub==="playing"&&gameType==="word"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column"}}>
            <div style={{padding:"12px 16px",background:"#fff",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:14,fontWeight:700}}>끝말잇기 vs {gameOpp?.name}</span>
              <button style={{fontSize:12,color:"#f43f5e",border:"none",background:"none",fontWeight:600}} onClick={()=>{setSub(null);setGameType(null);}}>종료</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:16}}>
              {err&&<div style={{...S.errS,marginBottom:8}}>{err}</div>}
              {wordChain.map((w,i)=><div key={i} style={{display:"flex",justifyContent:w.player===me.name?"flex-end":"flex-start",marginBottom:6}}>
                <div style={{background:w.player===me.name?"#6366f1":"#fff",color:w.player===me.name?"#fff":"#1e293b",padding:"10px 18px",borderRadius:20,fontSize:16,fontWeight:600,border:w.player===me.name?"none":"1px solid #e2e8f0"}}>{w.word}</div>
              </div>)}
              {wordChain.length===0&&<p style={{textAlign:"center",color:"#94a3b8",marginTop:40}}>첫 단어를 입력하세요!</p>}
            </div>
            <div style={{display:"flex",gap:8,padding:"10px 14px",background:"#fff",borderTop:"1px solid #f1f5f9"}}>
              <input style={{flex:1,padding:"10px 14px",borderRadius:24,border:"1px solid #e2e8f0",fontSize:14,outline:"none",fontFamily:"inherit"}} placeholder="단어 입력..." value={wordIn} onChange={e=>setWordIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();submitWord();}}} />
              <button style={{width:40,height:40,borderRadius:20,border:"none",background:"#6366f1",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={submitWord}>{I.send}</button>
            </div>
          </div>
        )}

        {/* Playing omok */}
        {tab==="game"&&sub==="playing"&&gameType==="omok"&&omBoard&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{padding:"12px 16px",background:"#fff",borderBottom:"1px solid #f1f5f9",width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:14,fontWeight:700}}>오목 vs {gameOpp?.name}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:14,height:14,borderRadius:7,background:omTurn===1?"#1e293b":"#fff",border:"2px solid #1e293b"}} /><span style={{fontSize:12,color:"#64748b"}}>{omTurn===1?"흑":"백"} 차례</span></div>
              <button style={{fontSize:12,color:"#f43f5e",border:"none",background:"none",fontWeight:600}} onClick={()=>{setSub(null);setGameType(null);}}>종료</button>
            </div>
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",overflow:"auto",padding:8}}>
              <div style={{display:"grid",gridTemplateColumns:`repeat(15,24px)`,gap:0,background:"#dcb35c",padding:4,borderRadius:4}}>
                {omBoard.map((row,r)=>row.map((cell,c)=>(
                  <div key={`${r}-${c}`} style={{width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}} onClick={()=>placeStone(r,c)}>
                    <div style={{position:"absolute",inset:0,borderRight:c<14?"1px solid #b8963e":"none",borderBottom:r<14?"1px solid #b8963e":"none"}} />
                    {cell!==0&&<div style={{width:20,height:20,borderRadius:10,background:cell===1?"#1e293b":"#fff",border:cell===2?"2px solid #ccc":"none",position:"relative",zIndex:1,boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}} />}
                  </div>
                )))}
              </div>
            </div>
          </div>
        )}

        {/* ===== MORE ===== */}
        {tab==="more"&&(
          <div style={{flex:1,overflowY:"auto"}}>
            {/* Profile card */}
            <div style={{background:"#fff",padding:24,textAlign:"center",borderBottom:"1px solid #f1f5f9"}}>
              <div style={{position:"relative",display:"inline-block",marginBottom:12}}>
                <Av src={me.photo} name={me.name} color={me.color} size={72} />
                <button style={{position:"absolute",bottom:-2,right:-2,width:26,height:26,borderRadius:13,background:"#6366f1",border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12}} onClick={()=>pfRef.current?.click()}>✏</button>
                <input ref={pfRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleImg(e,updatePhoto)} />
              </div>
              <h2 style={{fontSize:18,fontWeight:800,color:"#1e293b",margin:"0 0 2px"}}>{me.name}</h2>
              <p style={{fontSize:13,color:"#94a3b8",margin:"0 0 8px"}}>{isT?"담임선생님":`${me.num}번`} · {CF}</p>
              {editPf?<div style={{display:"flex",gap:6,maxWidth:260,margin:"0 auto"}}><input style={{...S.in,flex:1,padding:"8px 12px",fontSize:13}} value={stIn} onChange={e=>setStIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&updateSt()} placeholder="상태 메시지" autoFocus /><button style={{padding:"8px 12px",borderRadius:10,border:"none",background:"#6366f1",color:"#fff",fontSize:12,fontWeight:600}} onClick={updateSt}>저장</button></div>
              :<p style={{fontSize:13,color:me.status?"#64748b":"#94a3b8",cursor:"pointer",margin:0}} onClick={()=>{setEditPf(true);setStIn(me.status||"");}}>{me.status||"상태 메시지를 입력하세요"} ✏️</p>}
            </div>

            {/* Menu */}
            <div style={{padding:16}}>
              {[{l:"멤버 목록",ic:I.users,fn:()=>{setMoreTab("members");setSub("more-sub");}},
                ...(isT?[{l:"관리자 패널",ic:I.settings,fn:()=>{setMoreTab("admin");setSub("more-sub");}}]:[]),
                {l:"로그아웃",ic:I.back,fn:logout,danger:true}
              ].map((m,i)=>(
                <button key={i} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"#fff",borderRadius:12,border:"1px solid #f1f5f9",marginBottom:8,fontSize:14,fontWeight:600,color:m.danger?"#dc2626":"#1e293b",fontFamily:"inherit",textAlign:"left"}} onClick={m.fn}>
                  <span style={{color:m.danger?"#dc2626":"#64748b"}}>{m.ic}</span>{m.l}
                </button>
              ))}
            </div>

            {/* Members */}
            {sub==="more-sub"&&moreTab==="members"&&(
              <div style={{position:"fixed",inset:0,background:"#fff",zIndex:100,overflowY:"auto"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",borderBottom:"1px solid #f1f5f9"}}>
                  <button style={{border:"none",background:"none",padding:0,color:"#64748b"}} onClick={()=>setSub(null)}>{I.back}</button>
                  <span style={{fontSize:16,fontWeight:700}}>멤버 목록 ({members.length})</span>
                </div>
                <div style={{padding:16}}>
                  {teachers.length>0&&<><h4 style={{fontSize:13,fontWeight:700,color:"#94a3b8",margin:"0 0 8px"}}>선생님</h4>
                    {teachers.map(u=><div key={u.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f8fafc"}}><Av src={u.photo} name={u.name} color={u.color} size={40} /><div><div style={{fontSize:14,fontWeight:600,color:"#1e293b"}}>{u.name} <span style={{fontSize:11,color:"#f43f5e",fontWeight:700}}>선생님</span></div>{u.status&&<div style={{fontSize:12,color:"#94a3b8"}}>{u.status}</div>}</div></div>)}</>}
                  <h4 style={{fontSize:13,fontWeight:700,color:"#94a3b8",margin:"16px 0 8px"}}>학생 ({students.length})</h4>
                  {students.map(u=><div key={u.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f8fafc"}}><Av src={u.photo} name={u.name} color={u.color} size={40} /><div><div style={{fontSize:14,fontWeight:600,color:"#1e293b"}}>{u.num}번 {u.name}</div>{u.status&&<div style={{fontSize:12,color:"#94a3b8"}}>{u.status}</div>}</div></div>)}
                </div>
              </div>
            )}

            {/* Admin */}
            {sub==="more-sub"&&moreTab==="admin"&&isT&&(
              <div style={{position:"fixed",inset:0,background:"#f8fafc",zIndex:100,overflowY:"auto"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",background:"#fff",borderBottom:"1px solid #f1f5f9"}}>
                  <button style={{border:"none",background:"none",padding:0,color:"#64748b"}} onClick={()=>setSub(null)}>{I.back}</button>
                  <span style={{fontSize:16,fontWeight:700}}>관리자 패널</span>
                </div>
                <div style={{padding:16}}>
                  <h4 style={{fontSize:13,fontWeight:700,color:"#94a3b8",margin:"0 0 10px"}}>학생 관리</h4>
                  {students.map(u=><div key={u.id} style={{background:"#fff",borderRadius:12,padding:14,marginBottom:8,border:"1px solid #f1f5f9"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><Av src={u.photo} name={u.name} color={u.color} size={30} /><span style={{fontSize:14,fontWeight:600}}>{u.num}번 {u.name}</span></div>
                    <div style={{display:"flex",gap:6}}><button style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,fontWeight:600,fontFamily:"inherit"}} onClick={()=>{const pw=prompt("새 비밀번호 (4자 이상):");if(pw)adminResetPw(u.id,pw);}}>비번 초기화</button><button style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid #fecaca",background:"#fff",color:"#dc2626",fontSize:12,fontWeight:600,fontFamily:"inherit"}} onClick={()=>{if(confirm(`${u.name} 학생을 제거하시겠습니까?`))adminRemove(u.id);}}>제거</button></div>
                  </div>)}
                  <h4 style={{fontSize:13,fontWeight:700,color:"#94a3b8",margin:"20px 0 10px"}}>게시글 관리</h4>
                  {posts.map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:"#fff",borderRadius:10,marginBottom:6,border:"1px solid #f1f5f9"}}>
                    <div><span style={{fontSize:13,fontWeight:600}}>{p.title}</span><span style={{fontSize:11,color:"#94a3b8",marginLeft:6}}>{p.author}</span></div>
                    <button style={{border:"none",background:"none",color:"#dc2626",padding:4}} onClick={()=>adminDelPost(p.id)}>{I.del}</button>
                  </div>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{display:"flex",background:"#fff",borderTop:"1px solid #f1f5f9",padding:"6px 0 2px",paddingBottom:"max(2px,env(safe-area-inset-bottom))"}}>
        {[{k:"home",l:"홈",ic:I.home},{k:"chat",l:"소통",ic:I.chat},{k:"board",l:"게시판",ic:I.board},{k:"game",l:"게임",ic:I.game},{k:"more",l:"더보기",ic:I.more}].map(t=>(
          <button key={t.k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,border:"none",background:"none",padding:"6px 0",color:tab===t.k?"#6366f1":"#94a3b8",fontFamily:"inherit"}} onClick={()=>{setTab(t.k);setSub(null);setSelAnn(null);setSelPost(null);setSelRec(null);setDmTgt(null);setGameType(null);setChatMode("group");clr();}}>
            {t.ic}<span style={{fontSize:10,fontWeight:600}}>{t.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== STYLES =====
const S = {
  lb:{fontSize:12,fontWeight:600,color:"#64748b",marginBottom:4,display:"block"},
  in:{width:"100%",padding:"11px 14px",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff",color:"#1e293b",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"'Pretendard',-apple-system,sans-serif"},
  btn:{width:"100%",padding:"13px",borderRadius:12,border:"none",background:"#6366f1",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Pretendard',-apple-system,sans-serif"},
  ta:{width:"100%",padding:"11px 14px",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff",color:"#1e293b",fontSize:14,outline:"none",resize:"vertical",minHeight:80,lineHeight:1.7,boxSizing:"border-box",fontFamily:"'Pretendard',-apple-system,sans-serif"},
  rsA:{flex:1,padding:"11px",borderRadius:12,border:"none",background:"#6366f1",color:"#fff",fontSize:14,fontWeight:700,fontFamily:"inherit"},
  rsI:{flex:1,padding:"11px",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:14,fontWeight:600,fontFamily:"inherit"},
  card:{background:"#fff",borderRadius:14,padding:"14px 16px",marginBottom:8,border:"1px solid #f1f5f9",cursor:"pointer"},
  stat:{background:"#fff",borderRadius:14,padding:"14px 10px",textAlign:"center",border:"1px solid #f1f5f9",display:"flex",flexDirection:"column",gap:2},
  sh:{fontSize:15,fontWeight:700,color:"#1e293b",margin:"0 0 10px"},
  stA:{flex:1,padding:"12px 0",border:"none",background:"transparent",color:"#6366f1",fontSize:13,fontWeight:700,borderBottom:"2px solid #6366f1",fontFamily:"inherit"},
  stI:{flex:1,padding:"12px 0",border:"none",background:"transparent",color:"#94a3b8",fontSize:13,fontWeight:600,borderBottom:"2px solid transparent",fontFamily:"inherit"},
  newBtn:{width:"100%",padding:"12px",borderRadius:12,border:"1px dashed #c7d2fe",background:"#eef2ff",color:"#6366f1",fontSize:14,fontWeight:700,marginBottom:12,fontFamily:"inherit",cursor:"pointer"},
  formBox:{background:"#fff",borderRadius:14,padding:16,marginBottom:14,display:"flex",flexDirection:"column",gap:10,border:"1px solid #f1f5f9"},
  errS:{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"8px 12px",color:"#dc2626",fontSize:13,textAlign:"center"},
};
