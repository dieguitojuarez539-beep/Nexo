import { env } from 'cloudflare:workers';
export const dynamic='force-dynamic';
async function proxy(req:Request,{params}:{params:Promise<{path:string[]}>}){
 const e=env as unknown as {API_ORIGIN?:string;API_PROXY_SECRET?:string};const {path}=await params;
 if(!e.API_ORIGIN){
  if(path.join('/')==='config')return Response.json({preview:true,currencies:['USD'],retentionDays:7,maxFileMB:500,commissions:{USD:{threshold:10000,below:10,above:15},ARS:{threshold:20000000,below:10,above:15}},minimumWithdrawals:{USD:1000,ARS:100000},legalReady:false});
  if(path.join('/')==='auth/me')return Response.json({user:null,preview:true});
  return Response.json({message:'La vista previa no tiene el servidor conectado. Todavía no se reciben registros, archivos ni pagos.'},{status:503});
 }
 const target=new URL('/v1/'+path.map(encodeURIComponent).join('/'),e.API_ORIGIN);target.search=new URL(req.url).search;
 if(target.protocol!=='https:')return Response.json({message:'Configuración de conexión inválida.'},{status:503});
 const h=new Headers();for(const name of ['content-type','cookie','x-nexo-request','range','paypal-transmission-id','paypal-transmission-time','paypal-transmission-sig','paypal-cert-url','paypal-auth-algo']){const v=req.headers.get(name);if(v)h.set(name,v)}
 h.set('x-nexo-proxy',e.API_PROXY_SECRET||'');h.set('x-client-ip',req.headers.get('cf-connecting-ip')||'');h.set('user-agent',req.headers.get('user-agent')||'');
 const incomingOrigin=req.headers.get('origin');if(incomingOrigin&&incomingOrigin!==new URL(req.url).origin)return Response.json({message:'Origen no permitido.'},{status:403});
 if(incomingOrigin)h.set('origin',incomingOrigin);
 try{const upstream=await fetch(target,{method:req.method,headers:h,body:['GET','HEAD'].includes(req.method)?undefined:req.body,redirect:'manual'});const out=new Headers();for(const k of ['content-type','content-disposition','content-length','content-range','accept-ranges']){const v=upstream.headers.get(k);if(v)out.set(k,v)}for(const cookie of upstream.headers.getSetCookie())out.append('set-cookie',cookie);out.set('cache-control','no-store');out.set('x-content-type-options','nosniff');return new Response(upstream.body,{status:upstream.status,headers:out});}
 catch{return Response.json({message:'El servidor no está disponible. Intentá nuevamente en unos minutos.'},{status:503})}
}
export {proxy as GET,proxy as POST,proxy as PATCH,proxy as DELETE,proxy as PUT};
