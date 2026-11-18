import {createContext,useContext} from 'react';
export const AuthContext=createContext({user:null,requireLogin:()=>false});
export function useAuth(){return useContext(AuthContext);}
export function LoginRequired({onLogin}){return <section className="login-required"><span aria-hidden="true">🔒</span><h1>로그인하고 이용해주세요</h1><p>내 활동과 프로필은 로그인 후 확인할 수 있어요.<br/>불편함과 프로젝트는 로그인 없이 둘러볼 수 있어요.</p><button className="button primary" onClick={onLogin}>로그인하러 가기</button></section>;}
