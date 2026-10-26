/* Kita-Helfer platform layer.
   Gives the app the same small API it had inside Claude (db, user, downloads, assets),
   backed by IndexedDB on the device. An optional remote (window.KH_REMOTE, see remote.js)
   mirrors the already-encrypted documents and photos between devices. */
(()=>{
  let dbp;
  function idb(){return dbp||(dbp=new Promise((res,rej)=>{const r=indexedDB.open("kita-helfer",1);
    r.onupgradeneeded=()=>{const d=r.result;["docs","blobs","outbox","kv"].forEach(n=>d.createObjectStore(n))};
    r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))}
  async function run(store,mode,fn){const d=await idb();return new Promise((res,rej)=>{const t=d.transaction(store,mode);const req=fn(t.objectStore(store));
    t.oncomplete=()=>res(req&&req.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})}
  const get=(s,k)=>run(s,"readonly",o=>o.get(k));
  const put=(s,k,v)=>run(s,"readwrite",o=>o.put(v,k));
  const del=(s,k)=>run(s,"readwrite",o=>o.delete(k));
  async function entries(s){const d=await idb();return new Promise((res,rej)=>{const out=[];const t=d.transaction(s,"readonly");const c=t.objectStore(s).openCursor();
    c.onsuccess=()=>{const cur=c.result;if(cur){out.push([cur.key,cur.value]);cur.continue()}};t.oncomplete=()=>res(out);t.onerror=()=>rej(t.error)})}

  const R=()=>window.KH_REMOTE||null;
  const listeners=new Set();
  let status="local";const statusListeners=new Set();
  function setStatus(s){status=s;statusListeners.forEach(f=>{try{f(s)}catch{}})}

  async function snapshot(){const docs=(await entries("docs")).map(([id,v])=>({id,data:()=>v}));return {docs,size:docs.length,empty:!docs.length}}
  async function notify(){const s=await snapshot();listeners.forEach(([n])=>{try{n(s)}catch(e){console.warn(e)}})}

  /* outbox: everything that still has to reach the remote, so offline edits are never lost */
  async function queue(key,op){await put("outbox",key,op);drain()}
  let draining=false,again=false;
  async function drain(){
    const r=R();if(!r)return;if(draining){again=true;return}draining=true;again=false;
    try{
      for(const [key,op] of await entries("outbox")){
        if(op.k==="doc"){const v=await get("docs",op.name);if(v)await r.putDoc(op.name,v);else await r.deleteDoc(op.name)}
        else if(op.k==="blob"){const v=await get("blobs",op.id);if(v!=null)await r.putBlob(op.id,v)}
        else if(op.k==="blobdel"){await r.deleteBlob(op.id)}
        await del("outbox",key);
      }
      setStatus("ok");
    }catch(e){console.warn(e);setStatus(e&&e.code==="full"?"full":"offline")}
    finally{draining=false;if(again)drain()}
  }
  let pulling=false;
  async function pull(){
    const r=R();if(!r||pulling)return;pulling=true;
    try{
      const since=(await get("kv","pulledAt"))||0;let changed=false;
      const {items,cursor}=await r.pullDocs(since);
      for(const {name,body} of items){
        if(await get("outbox","doc:"+name))continue; // a local edit is still on its way and wins
        const mine=await get("docs",name);
        if(body.deleted){if(mine){await del("docs",name);changed=true}continue}
        if(!mine||mine.ts!==body.ts){await put("docs",name,body);changed=true}
      }
      await put("kv","pulledAt",cursor);
      if(changed)notify();
      if(status!=="saving")setStatus("ok");
    }catch(e){console.warn(e);setStatus("offline")}
    finally{pulling=false}
  }
  function startSync(){if(!R())return;drain();pull();setInterval(()=>{if(document.visibilityState==="visible"){drain();pull()}},30000);
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"){drain();pull()}});window.addEventListener("online",()=>{drain();pull()})}

  const docRef=name=>({
    async get(){let v=await get("docs",name);if(!v&&name==="meta"&&R()){try{v=await R().getDoc("meta");if(v)await put("docs","meta",v)}catch(e){throw {code:"unavailable"}}}return {exists:!!v,data:()=>v}},
    async set(v){await put("docs",name,v);await queue("doc:"+name,{k:"doc",name})},
    async delete(){await del("docs",name);await queue("doc:"+name,{k:"doc",name})}
  });
  const db={collection(){return {doc:docRef,onSnapshot(next,err){const l=[next,err];listeners.add(l);snapshot().then(next);return()=>listeners.delete(l)}}}};

  const user={id:async()=>"local"};

  const downloads={async save({filename,data}){
    const blob=data instanceof Blob?data:new Blob([data]);
    const file=new File([blob],filename,{type:blob.type||"application/octet-stream"});
    if(navigator.canShare&&/Android|iPhone|iPad/i.test(navigator.userAgent)&&navigator.canShare({files:[file]})){
      try{await navigator.share({files:[file],title:filename});return {status:"delivered"}}catch(e){if(e&&e.name==="AbortError")throw {code:"declined"}}}
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);return {status:"saved"};
  }};

  const hex=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,"0")).join("");
  const assets={
    async upload(blob){const id=hex();await put("blobs",id,await blob.text());await queue("blob:"+id,{k:"blob",id});return {id,url:""}},
    async delete(id){await del("blobs",id);await del("outbox","blob:"+id);if(R())await queue("blobdel:"+id,{k:"blobdel",id});return {deleted:true}},
    async list(){let bytes=0,maxBytes=0;try{const e=await navigator.storage.estimate();bytes=e.usage||0;maxBytes=e.quota||0}catch{}return {assets:[],usage:{bytes,maxBytes}}}
  };
  async function restoreBlob(id,text){if(!/^[0-9a-f]{32}$/.test(id))return;await put("blobs",id,text);await queue("blob:"+id,{k:"blob",id})}
  async function blobText(id){let v=await get("blobs",id);if(v==null&&R()){v=await R().getBlob(id);if(v!=null)await put("blobs",id,v)}if(v==null)throw new Error("fehlt");return v}

  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch{}
  const caps={db,user,downloads,assets};
  window.platform={
    use:async n=>caps[n]||null,
    blobText,
    restoreBlob,
    hasRemote:()=>!!R(),
    status:()=>status,
    onStatus:f=>statusListeners.add(f),
    startSync
  };
})();
