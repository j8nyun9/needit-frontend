import {defineConfig,loadEnv} from 'vite';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'');
 return {server:{proxy:{'/api':{target:env.API_PROXY_TARGET||'https://needit-backend-d3lv.onrender.com',changeOrigin:true}}}};
});
