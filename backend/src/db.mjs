import pg from 'pg';
export const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:12,ssl:process.env.PGSSL==='true'?{rejectUnauthorized:true}:undefined});
export const q=(sql,params=[])=>pool.query(sql,params);
export async function tx(fn){const c=await pool.connect();try{await c.query('BEGIN');const r=await fn(c);await c.query('COMMIT');return r}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}
export async function settings(c=pool){const {rows}=await c.query('SELECT key,value FROM settings');return Object.fromEntries(rows.map(r=>[r.key,r.value]))}
export async function outbox(c,key,kind,payload){await c.query('INSERT INTO outbox(event_key,kind,payload) VALUES($1,$2,$3) ON CONFLICT(event_key) DO NOTHING',[key,kind,JSON.stringify(payload)])}
