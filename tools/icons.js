// Genera los iconos de la app (PNG) a partir de un SVG. Uso: node tools/icons.js <carpeta-salida> <pitagoras|chrono>
const {chromium}=require('playwright');const path=require('path');
const [out,kind]=process.argv.slice(2);
const PITA=s=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${s}" height="${s}"><defs><radialGradient id="g" cx=".5" cy=".38" r=".75"><stop offset="0" stop-color="#3a2f46"/><stop offset="1" stop-color="#15121c"/></radialGradient><radialGradient id="h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f2a541" stop-opacity=".35"/><stop offset="1" stop-color="#f2a541" stop-opacity="0"/></radialGradient></defs>
<rect width="512" height="512" fill="url(#g)"/><circle cx="256" cy="256" r="200" fill="url(#h)"/>
<g transform="translate(256 256) scale(.95) translate(-250 -255)" stroke-linejoin="round">
<path d="M190 300 H310 V420 H190Z" fill="#4cbccb" fill-opacity=".85" stroke="#8fe3ec" stroke-width="6"/>
<path d="M100 210 H190 V300 H100Z" fill="#f2a541" fill-opacity=".9" stroke="#ffd27f" stroke-width="6"/>
<path d="M190 210 L310 300 L400 180 L280 90Z" fill="#9cc472" fill-opacity=".85" stroke="#cfe6a8" stroke-width="6"/>
<path d="M190 300 L310 300 L190 210Z" fill="#28232f" stroke="#f0e6cf" stroke-width="9"/>
<path d="M190 280 H210 V300" fill="none" stroke="#f0e6cf" stroke-width="5"/></g></svg>`;
const CHRONO=s=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${s}" height="${s}"><defs><radialGradient id="g" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="#20283a"/><stop offset="1" stop-color="#090b12"/></radialGradient></defs>
<rect width="512" height="512" fill="url(#g)"/>
<circle cx="256" cy="256" r="160" fill="none" stroke="#f2a65a" stroke-width="16"/>
${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,r1=i%3?138:128;return `<line x1="${256+Math.cos(a)*r1}" y1="${256+Math.sin(a)*r1}" x2="${256+Math.cos(a)*150}" y2="${256+Math.sin(a)*150}" stroke="#f2a65a" stroke-width="${i%3?5:9}" stroke-linecap="round"/>`}).join('')}
<text x="256" y="300" text-anchor="middle" font-family="DejaVu Serif,Georgia,serif" font-size="170" font-weight="700" fill="#ecf0f7">Ω</text>
<path d="M266 326 l-24 36 h18 l-12 32 32 -46 h-18 z" fill="#6fd6e6"/></svg>`;
(async()=>{const b=await chromium.launch();const p=await b.newPage();const svg=kind==='chrono'?CHRONO:PITA;
 for(const [n,s] of [['icon-512.png',512],['icon-192.png',192],['apple-touch-icon.png',180]]){await p.setViewportSize({width:s,height:s});await p.setContent(`<html><body style="margin:0">${svg(s)}</body></html>`);await p.screenshot({path:path.join(out,n),omitBackground:false});}
 await b.close();console.log('iconos en',out);})();
