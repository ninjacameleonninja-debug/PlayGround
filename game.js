(() => {
  'use strict';
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d');
  const mapCanvas = document.getElementById('minimap');
  const mctx = mapCanvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const ui = {intro:$('intro'), missionType:$('missionType'), missionStatus:$('missionStatus'), title:$('objectiveTitle'), text:$('objectiveText'), actions:$('jobActions'), progress:$('progressWrap'), bar:$('progressBar'), label:$('progressLabel'), cash:$('cash'), heatText:$('heatText'), speed:$('speed'), speedBar:$('speedBar'), gear:$('gear'), nitro:$('nitroLabel'), toast:$('toast'), banner:$('eventBanner'), tip:$('routeTip'), tipText:$('routeTipText'), district:$('districtName'), fade:$('fadeLayer')};
  const W=2880,H=2400, roadX=[160,640,1120,1600,2080,2560],roadY=[150,630,1110,1590,2070], roadWidth=112;
  const rand=(a,b)=>a+Math.random()*(b-a), clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), hypot=Math.hypot;
  let vw=innerWidth,vh=innerHeight,dpr=1,last=0,elapsed=0,toastTimer=0,bannerTimer=0;
  const keys=Object.create(null);
  const player={x:1120,y:1110,angle:-Math.PI/2,speed:0,turn:0,nitro:100,heat:0,cash:1250,drift:0};
  let active=null,freeRoam=true,police=[],traffic=[],buildings=[],props=[],particles=[];
  const mission={kind:null,step:0,time:0,totalTime:0,targets:[],reward:0};
  const palettes=['#b88259','#b6ad91','#80927d','#9e7059','#c5b58c','#657966','#a18469','#d2c19a','#728478'];
  const districts=[{name:'TITAN DISTRICT',x:1120,y:1110},{name:'OLD TOWN',x:1600,y:630},{name:'FERENTARI',x:640,y:1590},{name:'UNIRII SQUARE',x:1600,y:1110},{name:'OBOR MARKET',x:2080,y:630},{name:'THE OUTSKIRTS',x:2560,y:1590}];
  const landmarkNames=[['CIRCUS PARK',640,150],['PIATA UNIRII',1600,1110],['OLD TOWN',1600,630],['GARA DE NORD',1120,1590],['OBOR MARKET',2080,630],['DRUMUL TABEREI',640,2070],['CITY OF CONTRASTS',2080,1590]];

  function resize(){
    vw=innerWidth;vh=innerHeight;dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(vw*dpr);canvas.height=Math.round(vh*dpr);
    canvas.style.width=vw+'px';canvas.style.height=vh+'px';
  }
  addEventListener('resize',resize);resize();
  function makeCity(){
    for(let row=0;row<roadY.length-1;row++)for(let col=0;col<roadX.length-1;col++){
      const x0=roadX[col]+roadWidth/2+13,y0=roadY[row]+roadWidth/2+13;
      const bw=roadX[col+1]-roadX[col]-roadWidth-26,bh=roadY[row+1]-roadY[row]-roadWidth-26;
      const count=3+Math.floor(Math.random()*3), courtyard=Math.random()<.36;
      if(courtyard){
        buildings.push({x:x0+52,y:y0+45,w:bw-104,h:bh-90,color:palettes[Math.floor(rand(0,palettes.length))],kind:'yard'});
        props.push({x:x0+bw/2,y:y0+bh/2,kind:'trees',scale:1});
        continue;
      }
      for(let i=0;i<count;i++){
        const cols=2, cw=(bw-42)/cols, ch=(bh-42)/2;
        let bx=x0+12+(i%cols)*cw,by=y0+12+Math.floor(i/cols)*ch;
        let width=cw-rand(13,30),height=ch-rand(12,27);
        if(i===count-1&&count%2){width*=.62;height*=.72;bx+=cw*.2;by+=ch*.13}
        buildings.push({x:bx,y:by,w:width,h:height,color:palettes[Math.floor(rand(0,palettes.length))],kind:Math.random()<.5?'slab':'house',seed:Math.random()*100});
        if(Math.random()<.55)props.push({x:bx+width+rand(-12,10),y:by+height+rand(-12,10),kind:'tree',scale:rand(.8,1.3)});
      }
    }
    props.push({x:640,y:150,kind:'park',scale:1.55},{x:1600,y:1110,kind:'square',scale:1.5},{x:2080,y:630,kind:'market',scale:1.15});
    for(let i=0;i<18;i++){
      let horizontal=Math.random()<.52, lane=roadWidth*.25*(Math.random()<.5?-1:1);
      traffic.push({x:horizontal?rand(0,W):roadX[Math.floor(rand(0,roadX.length))]+lane,y:horizontal?roadY[Math.floor(rand(0,roadY.length))]+lane:rand(0,H),horizontal,dir:Math.random()<.5?1:-1,speed:rand(72,135),color:['#bb6748','#d0c4a4','#657d8a','#a29b70','#e1d8bb','#6e7775'][i%6],angle:0});
    }
  }
  makeCity();

  function roundRect(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.stroke()}}
  function drawBuilding(b){
    const {x,y,w,h,color,kind}=b;
    ctx.fillStyle='rgba(0,0,0,.24)';ctx.fillRect(x+8,y+10,w,h);
    ctx.fillStyle=kind==='yard'?'#727968':'#696c5f';ctx.fillRect(x-4,y-4,w+8,h+8);
    ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
    ctx.fillStyle='rgba(255,230,174,.22)';ctx.fillRect(x,y,w,Math.max(3,h*.045));
    if(kind==='yard'){
      ctx.fillStyle='#717b58';ctx.fillRect(x+9,y+9,w-18,h-18);
      ctx.fillStyle='#d3c693';ctx.fillRect(x+w*.43,y+h*.42,w*.14,h*.17);
      for(let i=0;i<5;i++){let px=x+20+(i*61)%(w-32),py=y+24+(i*43)%(h-38);drawTree(px,py,.55)}
      return;
    }
    let cols=Math.max(2,Math.floor(w/24)),rows=Math.max(2,Math.floor(h/24));
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const wx=x+8+c*(w-15)/cols,wy=y+8+r*(h-15)/rows;
      const ww=Math.min(8,(w-20)/cols*.48),wh=Math.min(7,(h-20)/rows*.42);
      ctx.fillStyle=(r+c)%5===0?'#dcae69':'#394949';ctx.fillRect(wx,wy,ww,wh);
      if(kind==='slab'&&(c+r)%2===0){ctx.fillStyle='#b89c70';ctx.fillRect(wx-2,wy+wh,ww+4,2)}
    }
    ctx.fillStyle='#454a43';ctx.fillRect(x+w*.42,y+h*.55,w*.18,5);
  }
  function drawTree(x,y,s=1){
    ctx.fillStyle='#202a20';ctx.beginPath();ctx.ellipse(x+3*s,y+5*s,8*s,5*s,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=['#536946','#647a4c','#79834f'][Math.abs(Math.floor(x+y))%3];ctx.beginPath();ctx.arc(x,y,7*s,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#8c9560';ctx.beginPath();ctx.arc(x-2*s,y-2*s,3*s,0,Math.PI*2);ctx.fill();
  }
  function drawCity(){
    ctx.fillStyle='#647052';ctx.fillRect(0,0,W,H);
    for(let x=0;x<W;x+=64)for(let y=0;y<H;y+=64){ctx.fillStyle=((x*7+y*13)%5===0)?'#687554':'#626e4e';ctx.globalAlpha=.25;ctx.fillRect(x,y,64,64);ctx.globalAlpha=1}
    for(const b of buildings)drawBuilding(b);
    for(const x of roadX){
      ctx.fillStyle='#a49c81';ctx.fillRect(x-roadWidth/2-9,0,roadWidth+18,H);
      ctx.fillStyle='#373c3c';ctx.fillRect(x-roadWidth/2,0,roadWidth,H);
      ctx.fillStyle='#424748';ctx.fillRect(x-roadWidth*.34,0,roadWidth*.68,H);
      ctx.strokeStyle='#c9ad66';ctx.lineWidth=2;ctx.setLineDash([19,18]);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle='rgba(220,220,192,.27)';ctx.lineWidth=1;for(const off of [-roadWidth*.25,roadWidth*.25]){ctx.beginPath();ctx.moveTo(x+off,0);ctx.lineTo(x+off,H);ctx.stroke()}
    }
    for(const y of roadY){
      ctx.fillStyle='#a49c81';ctx.fillRect(0,y-roadWidth/2-9,W,roadWidth+18);
      ctx.fillStyle='#373c3c';ctx.fillRect(0,y-roadWidth/2,W,roadWidth);
      ctx.fillStyle='#424748';ctx.fillRect(0,y-roadWidth*.34,W,roadWidth*.68);
      ctx.strokeStyle='#c9ad66';ctx.lineWidth=2;ctx.setLineDash([19,18]);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle='rgba(220,220,192,.27)';ctx.lineWidth=1;for(const off of [-roadWidth*.25,roadWidth*.25]){ctx.beginPath();ctx.moveTo(0,y+off);ctx.lineTo(W,y+off);ctx.stroke()}
    }
    ctx.strokeStyle='rgba(192,180,143,.62)';ctx.lineWidth=2;
    for(const off of [-13,-5,5,13]){ctx.beginPath();ctx.moveTo(0,1110+off);ctx.lineTo(W,1110+off);ctx.stroke()}
    for(let x=30;x<W;x+=48){ctx.strokeStyle='rgba(174,158,121,.32)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,1098);ctx.lineTo(x,1122);ctx.stroke()}
    for(const x of roadX)for(const y of roadY){
      ctx.fillStyle='#d6d1bc';ctx.globalAlpha=.73;
      for(let i=-4;i<=4;i++){ctx.fillRect(x+i*12-3,y-roadWidth*.49,6,16);ctx.fillRect(x+i*12-3,y+roadWidth*.34,6,16);ctx.fillRect(x-roadWidth*.49,y+i*12-3,16,6);ctx.fillRect(x+roadWidth*.34,y+i*12-3,16,6)}ctx.globalAlpha=1;
    }
    for(let x of roadX)for(let y of roadY){if((x+y)%3!==0)continue;ctx.fillStyle='#d0c8ab';ctx.fillRect(x+75,y+68,4,4);ctx.fillStyle='#e7d2a0';ctx.beginPath();ctx.arc(x+77,y+70,3,0,Math.PI*2);ctx.fill()}
    for(const p of props){if(p.kind==='tree')drawTree(p.x,p.y,p.scale);else drawLandmark(p)}
    for(const [name,x,y] of landmarkNames){ctx.save();ctx.globalAlpha=.55;ctx.fillStyle='#f0ddaa';ctx.font='bold 10px monospace';ctx.letterSpacing='2px';ctx.fillText(name,x+76,y+88);ctx.restore()}
  }
  function drawLandmark(p){
    const x=p.x,y=p.y,s=p.scale;
    if(p.kind==='park'){
      ctx.fillStyle='#526c46';ctx.beginPath();ctx.ellipse(x,y,76*s,54*s,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#b4a779';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(x,y,49*s,34*s,-.4,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#98a075';ctx.beginPath();ctx.ellipse(x,y,20*s,12*s,0,0,Math.PI*2);ctx.fill();
      for(let i=0;i<13;i++)drawTree(x+Math.cos(i*2.4)*58*s,y+Math.sin(i*2.4)*40*s,.85);
    }else if(p.kind==='square'){
      ctx.fillStyle='#8f8871';ctx.fillRect(x-56*s,y-42*s,112*s,84*s);
      ctx.fillStyle='#aaa082';ctx.fillRect(x-48*s,y-34*s,96*s,68*s);
      ctx.fillStyle='#bd7551';ctx.beginPath();ctx.arc(x,y,16*s,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e0c779';ctx.beginPath();ctx.arc(x,y,9*s,0,Math.PI*2);ctx.fill();
      for(let i=0;i<4;i++){ctx.fillStyle='#4b6650';ctx.beginPath();ctx.arc(x+Math.cos(i*Math.PI/2)*37*s,y+Math.sin(i*Math.PI/2)*24*s,5*s,0,Math.PI*2);ctx.fill()}
    }else if(p.kind==='market'){
      ctx.fillStyle='#a1805f';ctx.fillRect(x-63*s,y-38*s,126*s,76*s);
      for(let i=0;i<5;i++){ctx.fillStyle=['#a85742','#ba9e56','#73834e'][i%3];ctx.fillRect(x-52*s+i*24*s,y-27*s,16*s,52*s)}
      ctx.fillStyle='#392d28';ctx.fillRect(x-66*s,y-42*s,132*s,9*s);
    }else if(p.kind==='trees')for(let i=0;i<8;i++)drawTree(x+Math.cos(i*Math.PI/4)*34,y+Math.sin(i*Math.PI/4)*30,.9);
  }

  function showToast(message){ui.toast.textContent=message;ui.toast.classList.add('show');toastTimer=2.2}
  function announce(message){ui.banner.textContent=message;bannerTimer=3.0}
  function beginMission(kind){
    active=true;mission.kind=kind;mission.step=0;mission.totalTime=kind==='race'?68:92;mission.time=mission.totalTime;
    if(kind==='race'){
      mission.targets=[{x:1600,y:1110},{x:2080,y:630},{x:2560,y:1590}];mission.reward=850;
      ui.missionType.textContent='STREET RACE';ui.title.textContent='No brakes. No second place.';ui.text.textContent='Thread the old avenues and hit every checkpoint before the clock runs out.';
      announce('STREET RACE · FIRST TO THE FINISH');showToast('RACE STARTED · KEEP IT ON THE ROAD');
    }else{
      mission.targets=[{x:640,y:630},{x:2560,y:2070}];mission.reward=1500;
      ui.missionType.textContent='AFTER-HOURS JOB';ui.title.textContent='One quick grab. Then vanish.';ui.text.textContent='Pick up the satchel in Obor and get it to the safehouse. Expect company.';
      announce('AFTER-HOURS JOB · NO QUESTIONS ASKED');showToast('THE JOB IS LIVE · FIND THE PACKAGE');
    }
    ui.missionStatus.textContent='JOB IN PROGRESS';ui.missionStatus.style.color=kind==='race'?'#d9f36a':'#f5a751';
    ui.actions.style.display='none';ui.progress.classList.add('visible');ui.intro.classList.add('hidden');
  }
  function endMission(won){
    const kind=mission.kind;
    if(won){
      const bonus=kind==='race'?Math.max(0,Math.floor(mission.time*7)):Math.max(0,Math.floor((5-player.heat)*100));
      const payout=mission.reward+bonus;player.cash+=payout;ui.cash.textContent='₤ '+player.cash.toLocaleString('en-US');player.heat=Math.max(0,player.heat-1.6);
      ui.missionType.textContent='JOB COMPLETE';ui.title.textContent=kind==='race'?'First across the line.':'Clean getaway.';ui.text.textContent=`You made ₤ ${payout.toLocaleString('en-US')}. Catch your breath, or take another job.`;
      ui.missionStatus.textContent='PAID IN FULL';ui.missionStatus.style.color='#d9f36a';announce('JOB COMPLETE · ₤ '+payout.toLocaleString('en-US'));showToast('CASH ADDED TO YOUR STASH');
    }else{
      ui.missionType.textContent='JOB BUSTED';ui.title.textContent='That went sideways.';ui.text.textContent='The window closed. Lose the heat and try another run.';
      ui.missionStatus.textContent='JOB FAILED';ui.missionStatus.style.color='#ff7567';announce('JOB FAILED · GET OUT OF SIGHT');showToast('MISSION FAILED');player.heat=Math.max(player.heat,1.3);
    }
    active=false;mission.kind=null;mission.targets=[];freeRoam=true;ui.actions.style.display='grid';ui.progress.classList.remove('visible');
    setTimeout(()=>{if(!active){ui.title.textContent='Make your own luck.';ui.text.textContent='The city is awake. Find a job, hit the road, and keep your head down.';ui.missionType.textContent='FREE ROAM';ui.missionStatus.textContent="CITY'S YOURS";ui.missionStatus.style.color='';}},4500);
  }
  function reachTarget(){
    if(!active)return;
    if(mission.kind==='heist'&&mission.step===0){
      if(!keys.e)return;
      mission.step=1;player.heat=Math.max(player.heat,2.1);mission.time=Math.min(mission.totalTime,mission.time+6);
      announce('SATCHEL SECURED · LOSE THE COPS');showToast('NOW GET TO THE SAFEHOUSE');
    }else if(mission.kind==='heist'&&mission.step===1){
      if(!keys.e)return;endMission(true);
    }else if(mission.kind==='race'){
      mission.step++;
      if(mission.step>=mission.targets.length){endMission(true);return}
      announce(`CHECKPOINT ${mission.step} / ${mission.targets.length} · KEEP PUSHING`);
    }
  }
  function updateMission(dt){
    if(!active)return;
    mission.time-=dt;if(mission.time<=0){mission.time=0;endMission(false);return}
    const target=mission.targets[mission.step],d=target?distance(player,target):Infinity;
    if(mission.kind==='race'&&d<48)reachTarget();
    const isHeist=mission.kind==='heist';
    const prompt=isHeist&&d<64;
    ui.tip.classList.toggle('visible',!!prompt);
    if(prompt)ui.tipText.textContent=mission.step===0?'GRAB THE SATCHEL':'DROP THE GOODS';
    const pct=mission.time/mission.totalTime;ui.bar.style.width=(pct*100)+'%';ui.bar.style.background=pct<.25?'#f16a5d':mission.kind==='heist'?'#f5a751':'#d9f36a';
    ui.label.textContent=`${mission.kind==='race'?'TIME':'WINDOW'}  ${Math.floor(mission.time/60)}:${String(Math.floor(mission.time%60)).padStart(2,'0')}   ·   ${mission.kind==='race'?`CP ${Math.min(mission.step+1,mission.targets.length)}/${mission.targets.length}`:mission.step===0?'FIND PACKAGE':'GETAWAY'}`;
    if(isHeist&&player.heat>0&&mission.step===1&&player.heat<.25&&d<85)endMission(true);
  }
  function updateHUD(dt){
    const kmh=Math.round(Math.abs(player.speed)*.43);ui.speed.textContent=String(kmh).padStart(3,'0');
    ui.speedBar.style.width=Math.min(100,kmh/2.5)+'%';ui.gear.textContent=player.speed>8?Math.min(5,Math.ceil(kmh/32)):player.speed< -8?'R':'N';
    ui.nitro.innerHTML=`NITRO <b class="${player.nitro<15?'empty':''}">${player.nitro<15?'LOW':Math.round(player.nitro)+'%'}</b>`;
    const heat=Math.ceil(player.heat);document.querySelectorAll('.heat-pips i').forEach((pip,i)=>pip.classList.toggle('hot',i<heat));
    ui.heatText.textContent=heat===0?'COLD':heat<2?'NOTICED':heat<4?'WANTED':'BURNING';ui.heatText.style.color=heat===0?'#d9f36a':heat<3?'#f5a751':'#ff675b';
    let nearest=districts[0],nd=Infinity;for(const d of districts){const n=distance(player,d);if(n<nd){nd=n;nearest=d}}ui.district.textContent=nearest.name;
    if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)ui.toast.classList.remove('show')}
    if(bannerTimer>0){bannerTimer-=dt;if(bannerTimer<=0)ui.banner.textContent=''}
  }
  function frame(now){
    const dt=Math.min(.04,(now-last)/1000||0);last=now;elapsed+=dt;
    updatePlayer(dt);updateTraffic(dt);updatePolice(dt);updateMission(dt);updateHUD(dt);
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt*1.35;p.x+=rand(-7,7)*dt;p.y+=rand(-7,7)*dt;if(p.life<=0)particles.splice(i,1)}
    drawWorld();requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  function setKey(event,down){
    const key=event.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))event.preventDefault();
    keys[key]=down;
  }
  addEventListener('keydown',e=>{setKey(e,true);if(e.repeat)return;if(e.key.toLowerCase()==='e'&&active&&mission.kind==='heist'){const t=mission.targets[mission.step];if(t&&distance(player,t)<64)reachTarget()}});
  addEventListener('keyup',e=>setKey(e,false));
  addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
  $('raceButton').addEventListener('click',()=>beginMission('race'));$('heistButton').addEventListener('click',()=>beginMission('heist'));
  $('introRace').addEventListener('click',()=>beginMission('race'));$('introHeist').addEventListener('click',()=>beginMission('heist'));
  document.querySelectorAll('[data-key]').forEach(button=>{
    const key=button.dataset.key;
    const down=e=>{e.preventDefault();keys[key]=true;button.classList.add('down');button.setPointerCapture?.(e.pointerId)};
    const up=e=>{e.preventDefault();keys[key]=false;button.classList.remove('down')};
    button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',up);button.addEventListener('lostpointercapture',up);
  });
})();
