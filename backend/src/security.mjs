import {createCipheriv,createDecipheriv,randomBytes,createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {HttpException} from '@nestjs/common';
export const fail=(status,message)=>{throw new HttpException({message},status)};
export const hash=v=>createHash('sha256').update(String(v)).digest('hex');
export const secret=()=>randomBytes(32).toString('base64url');
const key=()=>{const k=Buffer.from(process.env.DATA_ENCRYPTION_KEY||'','base64');if(k.length!==32)throw new Error('DATA_ENCRYPTION_KEY must be 32 bytes, base64');return k};
export function encrypt(value){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key(),iv);const out=Buffer.concat([c.update(JSON.stringify(value),'utf8'),c.final()]);return [iv,c.getAuthTag(),out].map(b=>b.toString('base64url')).join('.')}
export function decrypt(value){const [iv,tag,data]=value.split('.').map(v=>Buffer.from(v,'base64url'));const c=createDecipheriv('aes-256-gcm',key(),iv);c.setAuthTag(tag);return JSON.parse(Buffer.concat([c.update(data),c.final()]).toString('utf8'))}
export const blind=value=>createHmac('sha256',key()).update(String(value).trim().toLowerCase()).digest('hex');
export function equal(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y)}
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(buf){let bits=0,value=0,out='';for(const b of buf){value=(value<<8)|b;bits+=8;while(bits>=5){out+=alphabet[(value>>>(bits-5))&31];bits-=5}}if(bits)out+=alphabet[(value<<(5-bits))&31];return out}
function unbase32(s){let bits=0,value=0,out=[];for(const c of s){const v=alphabet.indexOf(c);if(v<0)throw new Error('Invalid TOTP secret');value=(value<<5)|v;bits+=5;if(bits>=8){out.push((value>>>(bits-8))&255);bits-=8}}return Buffer.from(out)}
export function totp(s,counter=Math.floor(Date.now()/30000)){const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(counter));const h=createHmac('sha1',unbase32(s)).update(b).digest();const off=h[h.length-1]&15;return String((h.readUInt32BE(off)&0x7fffffff)%1000000).padStart(6,'0')}
export function verifyTotp(s,code,last=-1,now=Date.now()){const n=Math.floor(now/30000);for(const x of [n,n-1,n+1])if(x>Number(last)&&equal(totp(s,x),code))return x;return null}
export function validTaxId(v){const s=String(v).replace(/\D/g,'');if(s.length!==11)return false;const weights=[5,4,3,2,7,6,5,4,3,2];const n=11-weights.reduce((a,w,i)=>a+Number(s[i])*w,0)%11;return Number(s[10])===(n===11?0:n===10?9:n)}
export async function audit(c,req,action,target,metadata={}){await c.query("SELECT pg_advisory_xact_lock(hashtext('nexo-audit'))");const last=(await c.query('SELECT event_hash FROM audit_events ORDER BY id DESC LIMIT 1')).rows[0]?.event_hash||'GENESIS';const payload={actor:req.user?.id||null,action,target,ip:req.clientIp||'',metadata,nonce:secret()};const digest=hash(last+JSON.stringify(payload));await c.query('INSERT INTO audit_events(actor_id,action,target_id,ip,metadata,previous_hash,event_hash) VALUES($1,$2,$3,$4,$5,$6,$7)',[payload.actor,action,target,payload.ip,JSON.stringify({...metadata,nonce:payload.nonce}),last,digest]);}
