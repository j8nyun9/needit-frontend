import React from 'react';
const paths = {
 thumbUp: <path d="M7 10H3v11h4m0-11 5-8c3 0 3 3 2 7h5a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 2H7V10Z"/>,
 thumbDown: <path d="M7 14H3V3h4m0 11 5 8c3 0 3-3 2-7h5a2 2 0 0 0 2-2l-2-8a2 2 0 0 0-2-2H7v11Z"/>,
 copy: <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
 code: <><path d="m8 5-6 7 6 7m8-14 6 7-6 7M14 3l-4 18"/></>,
 search: <><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></>,
 bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4M12 2V1"/></>,
 user: <><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2Z"/></>,
 pencil: <><path d="m16 3 5 5L8 21H3v-5ZM13 6l5 5M3 16l5 5"/></>,
 trash: <path d="M3 6h18M6 6l1 14h10l1-14M9 6V3h6v3m-5 4v6m4-6v6"/>,
 link: <path d="M10 13a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-6-5l-1 1m2 4a4 4 0 0 0-6-.5l-3 3a4 4 0 0 0 6 5l1-1"/>,
 users: <><circle cx="9" cy="7" r="4"/><path d="M1 22v-3a8 8 0 0 1 16 0v3M18 3a4 4 0 0 1 0 8m2 4a7 7 0 0 1 3 6"/></>,
 sparkles: <><path d="m10 3 3 7 7 3-7 3-3 7-3-7-6-3 6-3ZM20 1v6m-3-3h6M20 18v6m-3-3h6"/></>,
 arrow: <><path d="M3 12h18m-6-6 6 6-6 6"/></>,
 heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></>,
 folder: <><path d="M2 20V5a2 2 0 0 1 2-2h6l3 4h7a2 2 0 0 1 2 2v11Z"/></>,
 close: <path d="m6 6 12 12M6 18 18 6"/>,
};
export default function Icon({name, size = 24, ...props}) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>; }
