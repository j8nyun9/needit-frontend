import {useState} from 'react';
export default function useSessionPreference(key,fallback,allowed){
 function read(){try{const value=JSON.parse(sessionStorage.getItem(key));return typeof value==='string'&&(!allowed||allowed.includes(value))?value:fallback;}catch{return fallback;}}
 const [state,setState]=useState(()=>({key,value:read()}));
 const value=state.key===key?state.value:read();
 function setValue(next){const resolved=typeof next==='function'?next(value):next;setState({key,value:resolved});try{sessionStorage.setItem(key,JSON.stringify(resolved));}catch{}}
 return [value,setValue];
}
