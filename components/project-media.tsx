'use client';
import {useState} from 'react';
export function ProjectMedia({project}:{project:any}){
 const images=project.media?.filter((m:any)=>m.purpose==='image')||[];const video=project.media?.find((m:any)=>m.purpose==='video');
 const [selected,setSelected]=useState('');const active=selected||images[0]?.url||project.image;
 let embed:string|undefined;
 if(project.videoUrl){try{const u=new URL(project.videoUrl);if(u.hostname==='youtu.be')embed='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(u.pathname.slice(1));else if(['youtube.com','www.youtube.com'].includes(u.hostname)){const id=u.searchParams.get('v');if(id&&/^[\w-]{11}$/.test(id))embed='https://www.youtube-nocookie.com/embed/'+id;}else if(['vimeo.com','www.vimeo.com'].includes(u.hostname)&&/^\/\d+$/.test(u.pathname))embed='https://player.vimeo.com/video'+u.pathname;}catch{}}
 return <div className="stack"><img src={active} alt={project.title} className="detail-image"/>{images.length>1&&<div className="gallery-strip" aria-label="Galería de imágenes">{images.map((m:any,i:number)=><button key={m.id} type="button" className={active===m.url?'selected':''} aria-label={'Ver imagen '+(i+1)} aria-pressed={active===m.url} onClick={()=>setSelected(m.url)}><img src={m.url} alt={'Referencia '+(i+1)} loading="lazy"/></button>)}</div>}{video&&<video controls preload="metadata" style={{width:'100%',borderRadius:12}} src={video.url}>Tu navegador no puede reproducir este video.</video>}{embed&&<iframe src={embed} title={'Video de '+project.title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="fullscreen; picture-in-picture" allowFullScreen style={{width:'100%',aspectRatio:'16/9',border:0,borderRadius:12}}/>}</div>
}
