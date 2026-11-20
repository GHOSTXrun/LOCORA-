(() => {
  const tasks=[["Singapore",103.85,1.29,"Is the riverside path open?","Photograph the path and any closure signs from a public area.",2.5],["Tokyo",139.69,35.68,"How busy is the crossing?","Take a wide shot from the sidewalk.",3],["London",-0.13,51.51,"Is the station entrance open?","Capture the entrance and posted opening information.",2],["New York",-74,40.71,"How busy is Times Square?","Capture the plaza from the pedestrian area.",2],["São Paulo",-46.63,-23.55,"Is the street market set up?","Photograph the public stalls from across the street.",3.5],["Sydney",151.21,-33.87,"Is the waterfront walkway clear?","Capture current conditions along the public walkway.",2.75]];
  const canvas=document.querySelector('#world'), ctx=canvas.getContext('2d');
  if(!ctx) return;
  const panel=document.querySelector('#atlas');
  const select=document.querySelector('#cities');
  const hero = panel.hasAttribute('data-hero');
  let ready = false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const radians=Math.PI/180, tau=2*Math.PI;
  let width=0,height=0,dpr=1,yaw=(hero?-42:120)*radians,pitch=(hero?23:12)*radians,morph=0,target=0,selected=0,drag=null,paused=reduced.matches,last=0,visible=true;
  const positions=[];
  const stencil=document.createElement('canvas');
  stencil.width=720; stencil.height=360;
  const ink=stencil.getContext('2d',{willReadFrequently:true});
  for(const ring of window.LOCORA_LAND){
    ink.beginPath();
    ring.forEach(([lon,lat],i)=>ink[i?'lineTo':'moveTo']((lon+180)*2,(90-lat)*2));
    ink.closePath(); ink.fill();
  }
  const pixels=ink.getImageData(0,0,720,360).data;
  const flat=document.createElement('canvas');
  flat.width=720;flat.height=360;
  const flatCtx=flat.getContext('2d');
  flatCtx.drawImage(stencil,0,0);
  flatCtx.globalCompositeOperation='source-in';
  flatCtx.fillStyle='#2b3440';
  flatCtx.fillRect(0,0,720,360);
  const sphere=document.createElement('canvas');
  const resolution=240;
  sphere.width=resolution;sphere.height=resolution;
  const surface=sphere.getContext('2d');
  const framePixels=surface.createImageData(resolution,resolution);
  const sphereSamples=[];
  for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
    const a=(x+.5)*2/resolution-1,h=1-(y+.5)*2/resolution;
    const z=1-a*a-h*h;
    if(z>0)sphereSamples.push([a,h,Math.sqrt(z),(y*resolution+x)*4]);
  }
  function paintLand(sin,cos,sp,cp){
    const rgba=framePixels.data;
    for(const [a,h,depth,i] of sphereSamples){
      const sy=h*cp+depth*sp,b=depth*cp-h*sp;
      const lon=Math.atan2(a*cos+b*sin,b*cos-a*sin);
      const lat=Math.asin(Math.max(-1,Math.min(1,sy)));
      const x=Math.min(719,Math.floor((lon/Math.PI+1)*360));
      const y=Math.min(359,Math.floor((.5-lat/Math.PI)*360));
      const land=pixels[(y*720+x)*4+3]>128;
      const light=Math.max(0,depth*.66-a*.25+h*.26);
      rgba[i]=land?22+light*40:7+light*11;
      rgba[i+1]=land?29+light*49:11+light*16;
      rgba[i+2]=land?38+light*58:17+light*22;
      rgba[i+3]=Math.min(255,depth*3500);
    }
    surface.putImageData(framePixels,0,0);
  }
  const dots=[];
  function vector(lon,lat){const a=lon*radians,b=lat*radians,c=Math.cos(b);return [c*Math.sin(a),Math.sin(b),c*Math.cos(a),lon,lat];}
  for(let lat=-68;lat<84;lat+=1.75){
    const step=1.75/Math.max(.4,Math.cos(lat*radians));
    for(let lon=-179;lon<180;lon+=step){
      const x=Math.floor((lon+180)*2),y=Math.floor((90-lat)*2);
      if(pixels[(y*720+x)*4+3]>128) dots.push(vector(lon,lat));
    }
  }
  const grid=[];
  for(let lat=-60;lat<=60;lat+=30) grid.push(Array.from({length:121},(_,i)=>vector(i*3-180,lat)));
  for(let lon=-180;lon<180;lon+=30) grid.push(Array.from({length:61},(_,i)=>vector(lon,i*3-90)));
  const marks=tasks.map(t=>vector(t[1],t[2]));
  const arcPairs=[[0,1],[0,2],[0,5],[2,3],[3,4],[1,5]];
  const arcs=arcPairs.map(([a,b])=>{
    const u=marks[a],v=marks[b],angle=Math.acos(Math.min(1,Math.max(-1,u[0]*v[0]+u[1]*v[1]+u[2]*v[2]))),div=Math.sin(angle);
    return Array.from({length:49},(_,i)=>{
      const t=i/48,m=Math.sin((1-t)*angle)/div,n=Math.sin(t*angle)/div;
      const x=u[0]*m+v[0]*n,y=u[1]*m+v[1]*n,z=u[2]*m+v[2]*n;
      return [x,y,z,Math.atan2(x,z)/radians,Math.asin(y)/radians,1+Math.sin(Math.PI*t)*.18];
    });
  });
  function fit(){
    const box=canvas.getBoundingClientRect();
    width=box.width;height=box.height;
    dpr=Math.min(2,devicePixelRatio||1);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  }
  new ResizeObserver(fit).observe(canvas);fit();
  if('IntersectionObserver' in window) new IntersectionObserver(([entry])=>{visible=entry.isIntersecting}).observe(panel);
  function focusCity(i, orient=true){
    selected=i;select.value=String(i);
    const [city,lon,lat,question,detail,amount]=tasks[i];
    document.querySelector('#city').textContent=city;
    document.querySelector('#question').textContent=question;
    document.querySelector('#detail').textContent=detail;
    document.querySelector('#amount').textContent=amount.toFixed(2)+' USDC';
    document.querySelector('#coordinates').textContent=Math.abs(lat).toFixed(2)+'° '+(lat>=0?'N':'S')+' / '+Math.abs(lon).toFixed(2)+'° '+(lon>=0?'E':'W');
    if(orient&&target===0){const aim=lon*radians; yaw+=Math.atan2(Math.sin(aim-yaw),Math.cos(aim-yaw));pitch=lat*radians*.65;}
  }
  tasks.forEach(([city],i)=>select.add(new Option(city,String(i))));
  select.addEventListener('change',()=>focusCity(Number(select.value)));
  for(const button of document.querySelectorAll('[data-view]')){
    button.addEventListener('click',()=>{
      target=Number(button.dataset.view);
      for(const item of document.querySelectorAll('[data-view]')) item.setAttribute('aria-pressed',String(item===button));
      canvas.style.cursor=target?'crosshair':'grab';
      if(!target) focusCity(selected);
    });
  }
  const spin=document.querySelector('#spin');
  function spinState(){spin.textContent=paused?'Play rotation':'Pause rotation';spin.setAttribute('aria-pressed',String(!paused));}
  spin.addEventListener('click',()=>{paused=!paused;spinState()});spinState();
  reduced.addEventListener('change',()=>{paused=reduced.matches;spinState()});
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{
    if(!drag||target)return;
    yaw-=(e.clientX-drag.x)*.009;
    pitch=Math.max(-1,Math.min(1,pitch+(e.clientY-drag.y)*.008));
    drag.x=e.clientX;drag.y=e.clientY;
  });
  canvas.addEventListener('pointerup',e=>{
    if(!drag)return;
    if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<8){
      const box=canvas.getBoundingClientRect();
      let best=28,index=-1;
      positions.forEach((p,i)=>{if(!p)return;const distance=Math.hypot(p[0]-e.clientX+box.left,p[1]-e.clientY+box.top);if(distance<best){best=distance;index=i}});
      if(index>=0)focusCity(index,false);
    }
    drag=null;
  });
  canvas.addEventListener('pointercancel',()=>{drag=null});
  canvas.addEventListener('lostpointercapture',()=>{drag=null});
  canvas.addEventListener('keydown',e=>{
    if(target||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();
    if(e.key==='ArrowLeft')yaw-=.16;if(e.key==='ArrowRight')yaw+=.16;
    if(e.key==='ArrowUp')pitch=Math.max(-1,pitch-.12);if(e.key==='ArrowDown')pitch=Math.min(1,pitch+.12);
  });
  focusCity(0,false);
  let lastDraw = 0;
  function frame(time){
    requestAnimationFrame(frame);
    const dt=Math.min(40,time-last||16);last=time;
    if(!width||!height||!visible||document.hidden)return;
    if (hero && time < lastDraw + 28) return;
    lastDraw = time;
    const clock=reduced.matches?0:time;
    if(!paused&&!drag&&!target)yaw+=dt*.00016;
    morph=reduced.matches?target:morph+(target-morph)*Math.min(1,dt*.009);
    const mix=morph*morph*(3-2*morph),radius=Math.min(width*(hero?.466:.41),height*(hero?.47:.43)),cx=width/2,cy=height*.50;
    const sin=Math.sin(yaw),cos=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
    function project(v){
      const [x,y,z,lon,lat,k=1]=v,a=x*cos-z*sin,b=x*sin+z*cos;
      const vertical=y*cp-b*sp,depth=y*sp+b*cp;
      return [cx+(1-mix)*a*radius*k+mix*lon/180*width*.46,cy-(1-mix)*vertical*radius*k-mix*lat/90*height*.36,depth,mix+(1-mix)*Math.max(0,Math.min(1,depth*8))];
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);
    for(let i=0;i<88;i++){ctx.fillStyle=i%11===0?'#c8d3df66':'#9aa9c12c';ctx.fillRect((i*97.31)%width,(i*i*37.13)%height,i%11===0?2:1,1);}
    if(mix<.99){
      const g=ctx.createRadialGradient(cx-radius*.28,cy-radius*.36,5,cx,cy,radius*1.02);
      g.addColorStop(0,'#26241f');g.addColorStop(.76,'#101315');g.addColorStop(1,'#211712');
      ctx.globalAlpha=1-mix;ctx.fillStyle=g;ctx.strokeStyle=hero?'#a2c9efaa':'#c3653375';
      ctx.shadowColor=hero?'#83c3ffbb':'#a77b5860';ctx.shadowBlur=hero?28:12;ctx.beginPath();ctx.arc(cx,cy,radius,0,tau);ctx.fill();ctx.shadowBlur=0;ctx.stroke();ctx.globalAlpha=1;
    }
    if(mix<.99){
      paintLand(sin,cos,sp,cp);
      ctx.globalAlpha=1-mix;
      ctx.drawImage(sphere,cx-radius,cy-radius,radius*2,radius*2);
      ctx.globalAlpha=1;
      if (hero) {
        const light=ctx.createLinearGradient(cx-radius,cy-radius,cx+radius,cy+radius);
        light.addColorStop(0,'#a2dfff');light.addColorStop(.32,'#78b8d970');light.addColorStop(.74,'#3977a220');light.addColorStop(1,'#0b0e1300');
        ctx.strokeStyle=light;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,radius,0,tau);ctx.stroke();
      }
    }
    if(mix>.4){
      ctx.globalAlpha=Math.max(0,(mix-.4)/.6);
      ctx.drawImage(flat,cx-width*.46,cy-height*.36,width*.92,height*.72);
      ctx.globalAlpha=1;
    }
    function line(points,color,thickness){
      ctx.strokeStyle=color;ctx.lineWidth=thickness;ctx.beginPath();
      let prev=null;
      for(const v of points){const p=project(v);if(p[3]<.16){prev=null;continue}
        if(!prev||Math.abs(p[0]-prev[0])>width*.47)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);prev=p;}
      ctx.stroke();
    }
    grid.forEach(points=>line(points,'#99a9bc18',.55));
    ctx.fillStyle='#d5a875';
    const size=Math.max(1,width/400);
    for(const v of dots){const p=project(v);if(p[3]<.04||mix>.98)continue;ctx.globalAlpha=(1-mix)*p[3]*.09;ctx.fillRect(p[0],p[1],size,size);}
    ctx.globalAlpha=1;
    arcs.forEach((arc,i)=>{
      line(arc,arcPairs[i].includes(selected)?'#ff975575':'#889bb132',arcPairs[i].includes(selected)?1:.7);
      const p=project(arc[Math.floor((clock*.014+i*7)%arc.length)]);
      if(p[3]>.2){ctx.fillStyle='#ffe3a2';ctx.shadowColor='#ff762e';ctx.shadowBlur=9;ctx.beginPath();ctx.arc(p[0],p[1],2,0,tau);ctx.fill();ctx.shadowBlur=0;}
    });
    marks.forEach((mark,i)=>{
      const p=project(mark);positions[i]=p[3]>.4?p:null;if(!positions[i])return;
      const hot=i===selected,pulse=(clock/1050+i*.2)%1;
      if(mix>.65){const g=ctx.createLinearGradient(p[0],p[1]-42,p[0],p[1]);g.addColorStop(0,'#ffb06a00');g.addColorStop(1,'#ff762eb0');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(p[0],p[1]-(hot?48:29));ctx.lineTo(p[0]+7,p[1]);ctx.lineTo(p[0]-7,p[1]);ctx.fill();}
      ctx.strokeStyle='rgba(255,145,67,'+(1-pulse)*.8+')';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p[0],p[1],6+pulse*(hot?19:11),0,tau);ctx.stroke();
      ctx.shadowColor='#ff762e';ctx.shadowBlur=hot?17:8;ctx.fillStyle=hot?'#ffedb9':'#ff833d';ctx.beginPath();ctx.arc(p[0],p[1],hot?5:3.5,0,tau);ctx.fill();ctx.shadowBlur=0;
      if(hot||width>600&&[1,2,4,5].includes(i)){ctx.font=(hot?'700 ':'')+'11px system-ui';ctx.fillStyle=hot?'#fff1db':'#d6bfa3';ctx.textAlign=p[0]>width*.78?'right':'left';ctx.fillText(tasks[i][0],p[0]+(p[0]>width*.78?-10:10),p[1]-8);}
    });
    if (hero && !ready) {
      ready = true;
      parent.postMessage('locora-globe-ready', location.origin);
    }
  }
  requestAnimationFrame(frame);
})();