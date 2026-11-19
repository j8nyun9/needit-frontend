import React from 'react';
import {serviceUrl} from '../services/projects.js';
export default function ServiceLaunchCard({project}){
 const url=serviceUrl(project.deployment_url);
 if(project.status!=='서비스 운영 중'||!url)return null;
 return <section className="service-launch" aria-label="공개된 서비스"><div><span className="status release-live">사용할 수 있어요</span><h2>완성된 서비스를 직접 사용해보세요</h2><p>{new URL(url).hostname} · 새 탭에서 열려요</p></div><a className="button primary" href={url} target="_blank" rel="noopener noreferrer">서비스 사용하기 ↗</a></section>;
}
