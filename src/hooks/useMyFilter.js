import {useState} from 'react';
function read(key){try{return Boolean(key)&&localStorage.getItem(key)==='true';}catch{return false;}}
export default function useMyFilter(userId,page){
 const key=userId?'needit-my-filter:'+userId+':'+page:null;
 const [state,setState]=useState(()=>({key,value:read(key)}));
 const enabled=key?(state.key===key?state.value:read(key)):false;
 function setEnabled(value){const next=Boolean(key)&&Boolean(typeof value==='function'?value(enabled):value);setState({key,value:next});if(key)try{localStorage.setItem(key,String(next));}catch{}}
 return [enabled,setEnabled];
}
