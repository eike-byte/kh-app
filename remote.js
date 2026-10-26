/* Sync between devices through Supabase (EU region).
   Only encrypted data ever leaves the device: documents are {iv, ct} objects, photos are
   encrypted JSON files. The Supabase login password is derived from the app password, so
   she only has to remember one password. Without config.js the app stays local only. */
(()=>{
  const C=window.KH_CONFIG;
  if(!C||!C.url||!C.anonKey){window.KH_SYNC=null;return}
  const base=C.url.replace(/\/+$/,"");
  const KEY="kh:session";
  let S=null;try{S=JSON.parse(localStorage.getItem(KEY)||"null")}catch{}
  const save=()=>{try{S?localStorage.setItem(KEY,JSON.stringify(S)):localStorage.removeItem(KEY)}catch{}};

  async function loginPassword(pw,email){
    const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveBits"]);
    const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode("kita-helfer-login:"+email.toLowerCase()),iterations:310000,hash:"SHA-256"},k,256);
    return Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,"0")).join("");
  }
  async function auth(path,body){
    const r=await fetch(base+"/auth/v1/"+path,{method:"POST",headers:{apikey:C.anonKey,"Content-Type":"application/json"},body:JSON.stringify(body)});
    return {ok:r.ok,status:r.status,j:await r.json().catch(()=>({}))};
  }
  function setSession(j){S={at:j.access_token,rt:j.refresh_token,exp:Date.now()+((j.expires_in||3600)-120)*1000,uid:j.user.id};save()}
  let refreshing=null;
  async function token(force){
    if(!S)throw {code:"auth"};
    if(force||Date.now()>S.exp){
      refreshing=refreshing||(async()=>{
        let r;try{r=await auth("token?grant_type=refresh_token",{refresh_token:S.rt})}catch{throw {code:"offline"}}
        if(r.ok)setSession(r.j);else if(r.status>=400&&r.status<500){S=null;save();window.KH_REMOTE=null;throw {code:"auth"}}else throw {code:"offline"};
      })().finally(()=>{refreshing=null});
      await refreshing;
    }
    return S.at;
  }
  async function api(method,path,body,headers={},retry=true){
    const t=await token();let r;
    try{r=await fetch(base+path,{method,headers:Object.assign({apikey:C.anonKey,Authorization:"Bearer "+t},headers),body})}catch{throw {code:"offline"}}
    if(r.status===401&&retry){await token(true);return api(method,path,body,headers,false)}
    if(!r.ok){const txt=await r.text().catch(()=>"");throw {code:r.status===413||/quota|exceed|too large/i.test(txt)?"full":"http",status:r.status,txt}}
    return r;
  }
  const json={"Content-Type":"application/json"};
  const upsert=row=>api("POST","/rest/v1/kh_docs?on_conflict=owner,name",JSON.stringify(Object.assign({owner:S.uid},row)),Object.assign({Prefer:"resolution=merge-duplicates,return=minimal"},json));
  const blobPath=id=>`kh-blobs/${S.uid}/${id}.json`;
  const notFound=e=>e&&(e.status===404||(e.status===400&&/not.?found/i.test(e.txt||"")));

  const remote={
    async getDoc(name){const r=await api("GET",`/rest/v1/kh_docs?select=body,deleted&name=eq.${encodeURIComponent(name)}`);const a=await r.json();return a[0]&&!a[0].deleted?a[0].body:null},
    putDoc:(name,body)=>upsert({name,body,deleted:false}),
    deleteDoc:name=>upsert({name,body:null,deleted:true}),
    async pullDocs(since){
      const items=[];let cursor=since;
      for(;;){const r=await api("GET",`/rest/v1/kh_docs?select=name,body,deleted,rev&rev=gt.${cursor}&order=rev.asc&limit=500`);const a=await r.json();
        a.forEach(x=>items.push({name:x.name,body:x.deleted?{deleted:true}:x.body}));if(a.length)cursor=a[a.length-1].rev;if(a.length<500)break}
      return {items,cursor};
    },
    putBlob:(id,text)=>api("POST","/storage/v1/object/"+blobPath(id),text,Object.assign({"x-upsert":"true"},json)),
    async getBlob(id){try{return await (await api("GET","/storage/v1/object/authenticated/"+blobPath(id))).text()}catch(e){if(notFound(e))return null;throw e}},
    async deleteBlob(id){try{await api("DELETE","/storage/v1/object/"+blobPath(id))}catch(e){if(!notFound(e))throw e}}
  };

  window.KH_SYNC={
    loggedIn:()=>!!S,
    email:()=>{try{return localStorage.getItem("kh:email")||""}catch{return ""}},
    async login(email,pw){
      let r;try{r=await auth("token?grant_type=password",{email,password:await loginPassword(pw,email)})}catch{return "offline"}
      if(r.ok){setSession(r.j);try{localStorage.setItem("kh:email",email)}catch{}window.KH_REMOTE=remote;return "ok"}
      return r.status===400?"invalid":"error";
    },
    async signup(email,pw){
      let r;try{r=await auth("signup",{email,password:await loginPassword(pw,email)})}catch{return "offline"}
      if(r.ok&&r.j.access_token){setSession(r.j);try{localStorage.setItem("kh:email",email)}catch{}window.KH_REMOTE=remote;return "ok"}
      if(r.ok)return "confirm";
      if(/already|registered|exists/i.test(JSON.stringify(r.j)))return "exists";
      if(/disabled|not allowed/i.test(JSON.stringify(r.j)))return "closed";
      return "error";
    },
    logout(){S=null;save();window.KH_REMOTE=null}
  };
  if(S)window.KH_REMOTE=remote;
})();
