'use client';
import {useEffect,useRef} from 'react';
import {Bold,Italic,List,ListOrdered,Heading2,Undo2} from 'lucide-react';
export function RichEditor({value,onChange}:{value:string;onChange:(html:string)=>void}){
 const editor=useRef<HTMLDivElement>(null);const previous=useRef('');
 useEffect(()=>{if(editor.current&&value!==previous.current){editor.current.innerHTML=value;previous.current=value}},[value]);
 const update=()=>{const html=editor.current?.innerHTML||'';previous.current=html;onChange(html)};
 const act=(command:string,arg?:string)=>{editor.current?.focus();document.execCommand(command,false,arg);update()};
 return <div className="rich-editor"><div className="toolbar" role="toolbar" aria-label="Formato del texto">{[{cmd:'bold',label:'Negrita',Icon:Bold},{cmd:'italic',label:'Cursiva',Icon:Italic},{cmd:'formatBlock',arg:'h2',label:'Título',Icon:Heading2},{cmd:'insertUnorderedList',label:'Lista con viñetas',Icon:List},{cmd:'insertOrderedList',label:'Lista numerada',Icon:ListOrdered},{cmd:'undo',label:'Deshacer',Icon:Undo2}].map(({cmd,arg,label,Icon})=><button key={cmd} type="button" aria-label={label} title={label} className="icon-btn" onMouseDown={e=>e.preventDefault()} onClick={()=>act(cmd,arg)}><Icon size={16}/></button>)}</div><div ref={editor} role="textbox" aria-label="Descripción larga" aria-multiline="true" contentEditable suppressContentEditableWarning onInput={update} onPaste={e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));update()}}/></div>
}
