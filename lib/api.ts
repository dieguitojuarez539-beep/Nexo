export async function api<T=any>(path:string,method='GET',body?:unknown):Promise<T>{
 const r=await fetch('/api/v1'+path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json','X-Nexo-Request':'1'}:{'X-Nexo-Request':'1'},body:body?JSON.stringify(body):undefined});
 const d:any=await r.json().catch(()=>({message:'No pudimos completar la solicitud.'}));if(!r.ok)throw new Error(d.message||'No pudimos completar la solicitud.');return d;
}
export async function uploadPrivate(file:File,purpose:string,onProgress:(n:number)=>void=()=>{},projectId?:string){
 const sample=await new Blob([String(file.size),String(file.lastModified),file.slice(0,1024*1024),file.slice(Math.max(0,file.size-1024*1024))]).arrayBuffer();
 const digest=await crypto.subtle.digest('SHA-256',sample);const fingerprint=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 const init=await api('/uploads/init','POST',{projectId,purpose,name:file.name,size:file.size,mime:file.type,fingerprint});
 if(init.status==='CLEAN'){onProgress(100);return init.id;}
 if(!init.status||init.status==='UPLOADING'){
  const parts:{PartNumber:number;ETag:string}[]=[...(init.parts||[])];const chunk=10*1024*1024;
  for(let start=0,part=1;start<file.size;start+=chunk,part++){
   if(parts.some(p=>p.PartNumber===part)){onProgress(Math.round(Math.min(start+chunk,file.size)/file.size*100));continue;}
   let etag:string|null=null;
   for(let attempt=0;attempt<3&&!etag;attempt++){try{const {url}=await api('/uploads/'+init.id+'/part','POST',{part});const r=await fetch(url,{method:'PUT',body:file.slice(start,start+chunk)});if(!r.ok)throw new Error('Falló la subida');etag=r.headers.get('ETag');}catch{if(attempt===2)throw new Error('La subida se interrumpió. Volvé a seleccionar el mismo archivo para reanudarla.');}}
   if(!etag)throw new Error('No se pudo confirmar la subida. Revisá la configuración del almacenamiento.');parts.push({PartNumber:part,ETag:etag});onProgress(Math.round(Math.min(start+chunk,file.size)/file.size*100));
  }
  await api('/uploads/'+init.id+'/complete','POST',{parts:parts.sort((a,b)=>a.PartNumber-b.PartNumber)});
 }
 for(let i=0;i<60;i++){const a=await api('/uploads/'+init.id);if(a.status==='CLEAN')return init.id;if(a.status==='REJECTED'||a.status==='DELETED')throw new Error('El archivo no superó la revisión de seguridad.');await new Promise(r=>setTimeout(r,2000));}
 throw new Error('El archivo sigue en revisión. Intentá publicar nuevamente cuando finalice el escaneo.');
}
