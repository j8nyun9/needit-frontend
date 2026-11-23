import React,{useRef,useState} from 'react';
import Icon from './common/Icon.jsx';
import ProblemDeleteDialog from './common/ProblemDeleteDialog.jsx';
export default function ProblemDeleteButton({problem,onDeleted}){
 const [open,setOpen]=useState(false),trigger=useRef(null);
 if(problem.mine!==true||problem.can_delete!==true)return null;
 return <><button ref={trigger} type="button" className="my-project-delete" onClick={()=>setOpen(true)}><Icon name="trash" size={15}/>불편함 삭제</button>
  {open&&<ProblemDeleteDialog problem={problem} onClose={()=>{setOpen(false);trigger.current?.focus();}} onDeleted={id=>{setOpen(false);onDeleted(id);}}/>}
 </>;
}
