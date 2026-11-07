import * as THREE from './three.module.js';

const $ = id => document.getElementById(id);
const canvas = $('scene');
const touchDevice = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
if (touchDevice) document.body.classList.add('touch');
$('control-hint').innerHTML = touchDevice ? 'LEFT STICK MOVE <i>•</i> DRAG TO AIM <i>•</i> HOLD FIRE' : 'WASD MOVE <i>•</i> MOUSE AIM <i>•</i> CLICK FIRE <i>•</i> R RELOAD';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb7a67d);
scene.fog = new THREE.Fog(0xb7a67d, 30, 95);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .1, 150);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !touchDevice, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, touchDevice ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !touchDevice;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

scene.add(new THREE.HemisphereLight(0xe5e8cb, 0x746347, 2.0));
const sun = new THREE.DirectionalLight(0xffe6b2, 3.2);
sun.position.set(-20, 32, -12);
sun.castShadow = !touchDevice;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -38; sun.shadow.camera.right = 38; sun.shadow.camera.top = 38; sun.shadow.camera.bottom = -38;
sun.shadow.bias = -.001;
scene.add(sun);

const mats = {
  sand: new THREE.MeshStandardMaterial({ color: 0xb9a579, roughness: 1 }),
  sandDark: new THREE.MeshStandardMaterial({ color: 0x98875f, roughness: 1 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x746e58, roughness: 1, flatShading: true }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x938a70, roughness: 1, flatShading: true }),
  olive: new THREE.MeshStandardMaterial({ color: 0x555d3c, roughness: .92, flatShading: true }),
  oliveDark: new THREE.MeshStandardMaterial({ color: 0x343b2d, roughness: .88, flatShading: true }),
  canvas: new THREE.MeshStandardMaterial({ color: 0x8e835d, roughness: 1, flatShading: true }),
  rust: new THREE.MeshStandardMaterial({ color: 0x77533d, roughness: .9, flatShading: true }),
  metal: new THREE.MeshStandardMaterial({ color: 0x30352e, metalness: .38, roughness: .65 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xc3b255, roughness: .9 }),
};
function mesh(geo, mat, parent=scene, pos=[0,0,0], rot=[0,0,0]) {
  const o = new THREE.Mesh(geo, mat); o.position.set(...pos); o.rotation.set(...rot); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
function box(w,h,d,mat,pos, parent=scene) { return mesh(new THREE.BoxGeometry(w,h,d),mat,parent,pos); }
function cylinder(rt,rb,h,segments,mat,pos, parent=scene) { return mesh(new THREE.CylinderGeometry(rt,rb,h,segments),mat,parent,pos); }

// Sandstone ground, scrub patches and distant angular ridges.
box(180,.5,180,mats.sand,[0,-.32,0]);
for(let i=0;i<95;i++){
  const x=(Math.random()-.5)*100, z=(Math.random()-.5)*100;
  if(Math.abs(x)<11&&Math.abs(z)<11)continue;
  const r=.25+Math.random()*1.1;
  const rock=mesh(new THREE.DodecahedronGeometry(r,0),Math.random()>.45?mats.sandDark:mats.stone,scene,[x,-.06+r*.12,z]);
  rock.scale.y=.25+Math.random()*.38; rock.rotation.set(Math.random(),Math.random()*3,Math.random());
}
for(let i=0;i<17;i++){
 const side=i%4, t=-48+i*6;
 const x=side===0?-49:side===1?49:t, z=side===2?-49:side===3?49:t;
 const ridge=mesh(new THREE.ConeGeometry(5+Math.random()*7,11+Math.random()*15,5),mats.sandDark,scene,[x,3,z]);
 ridge.rotation.z=(Math.random()-.5)*.4; ridge.scale.x=1.6;
}
// Outpost buildings and details.
const structures=[];
function building(x,z,w,d,h,mat=mats.concrete){
 box(w,h,d,mat,[x,h/2,z]); structures.push({x,z,w,d});
 box(w+.25,.22,d+.25,mats.oliveDark,[x,h+.08,z]);
 // dark doorway facing the player
 box(w*.23,h*.59,.06,mats.oliveDark,[x,h*.3,z+d/2+.035]);
 box(w*.28,.14,.12,mats.rust,[x,h*.68,z+d/2+.04]);
 for(let k=-1;k<=1;k++)box(.045,.65,.065,mats.metal,[x+k*.15,h*.3,z+d/2+.07]);
}
building(-6,-8,8,6,3.8,mats.concrete);
building(8,-11,6,5,3.1,mats.olive);
building(0,8,7,5,3.2,mats.stone);
// Relay mast with tripod legs and red beacon.
for(let a=0;a<3;a++){
 const ang=a*Math.PI*2/3;
 const leg=mesh(new THREE.CylinderGeometry(.065,.1,8,5),mats.metal,scene,[2+Math.cos(ang)*1.5,4,0+Math.sin(ang)*1.5]);
 leg.rotation.z=Math.cos(ang)*.18; leg.rotation.x=Math.sin(ang)*.18;
}
cylinder(.12,.12,8,6,mats.metal,[2,4,0]);
for(let y=2;y<7;y+=1.2){const ring=mesh(new THREE.TorusGeometry(1.05,.045,4,8),mats.metal,scene,[2,y,0]);ring.rotation.x=Math.PI/2;}
const beacon=new THREE.PointLight(0xff7151,14,9);beacon.position.set(2,8.2,0);scene.add(beacon);
cylinder(.17,.17,.1,8,mats.rust,[2,8.12,0]);
// Sandbags: individual softened blocks around the relay.
for(let row=0;row<2;row++)for(let i=0;i<10;i++){
 const angle=i*Math.PI*2/10, r=4.2;
 const bag=box(1.05,.42,.48,mats.canvas,[2+Math.cos(angle)*r,.25+row*.36,Math.sin(angle)*r]);
 bag.rotation.y=-angle;
}
// Crates and barrels around the camp.
function crate(x,z,s=1){box(s,s,s,mats.olive,[x,s/2,z]);box(s+.02,.08,s+.02,mats.oliveDark,[x,s,z]);box(.08,s,.08,mats.rust,[x-s*.27,s/2,z+s*.51]);}
crate(-11,1,1.3);crate(12,2,1.2);crate(-2,-14,1.15);crate(12,-5,.9);
for(const [x,z] of [[-12,-12],[10,7],[-10,9]]){cylinder(.42,.42,1.1,8,mats.rust,[x,.55,z]);cylinder(.43,.43,.1,8,mats.metal,[x,1.1,z]);}
// Perimeter posts with striped hazard bands and taut wire.
for(const side of [-1,1]) for(let i=0;i<11;i++){
 const z=-18+i*3.6,x=side*18;
 box(.16,1.35,.16,mats.oliveDark,[x,.67,z]);
 box(.18,.15,.18,mats.yellow,[x,.65,z]);
 if(i<10){const wire=mesh(new THREE.CylinderGeometry(.018,.018,3.6,4),mats.metal,scene,[x,1.05,z+1.8]);wire.rotation.x=Math.PI/2;}
}
// A few low scrub silhouettes.
for(let i=0;i<28;i++){
 const x=(Math.random()-.5)*45,z=(Math.random()-.5)*45;
 if(Math.hypot(x,z)<13)continue;
 const shrub=mesh(new THREE.IcosahedronGeometry(.35+Math.random()*.45,0),mats.oliveDark,scene,[x,.22,z]);shrub.scale.y=.45;
}

// First-person service rifle, fixed in the camera view.
const rifle=new THREE.Group(); camera.add(rifle); scene.add(camera);
box(.16,.18,.75,mats.oliveDark,[.34,-.32,-.78],rifle).rotation.x=.12;
box(.12,.34,.18,mats.olive,[.32,-.52,-.65],rifle).rotation.x=-.2;
box(.105,.12,.42,mats.metal,[.34,-.24,-1.23],rifle);
box(.08,.15,.1,mats.metal,[.34,-.14,-.94],rifle);
box(.045,.045,.36,mats.metal,[.34,-.12,-1.14],rifle);
const muzzleFlash=new THREE.PointLight(0xffbd63,0,5);muzzleFlash.position.set(.35,-.28,-1.5);camera.add(muzzleFlash);
const enemyMat=new THREE.MeshStandardMaterial({color:0x555944,roughness:.86,flatShading:true});
const enemyAccent=new THREE.MeshStandardMaterial({color:0x353c30,roughness:.82,flatShading:true});
const enemySkin=new THREE.MeshStandardMaterial({color:0xa98260,roughness:1,flatShading:true});
const enemyHitMat=new THREE.MeshStandardMaterial({color:0x8d4936,roughness:.9,flatShading:true});
const enemies=[];
function makeEnemy(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const torso=mesh(new THREE.BoxGeometry(.64,.82,.39),enemyMat,g,[0,1.2,0]);torso.rotation.x=-.05;
 mesh(new THREE.BoxGeometry(.72,.18,.43),enemyAccent,g,[0,1.57,0]);
 mesh(new THREE.BoxGeometry(.35,.38,.35),enemySkin,g,[0,1.8,0]);
 mesh(new THREE.SphereGeometry(.24,7,5),enemyMat,g,[0,2.04,0]);
 mesh(new THREE.BoxGeometry(.54,.12,.55),enemyAccent,g,[0,2.18,0]);
 const armL=mesh(new THREE.BoxGeometry(.2,.62,.22),enemyMat,g,[-.43,1.18,.03]);armL.rotation.z=-.22;
 const armR=mesh(new THREE.BoxGeometry(.2,.62,.22),enemyMat,g,[.43,1.18,.03]);armR.rotation.z=.22;
 mesh(new THREE.BoxGeometry(.1,.12,.57),mats.metal,g,[.25,1.15,-.34]);
 const legL=mesh(new THREE.BoxGeometry(.24,.68,.28),enemyAccent,g,[-.18,.38,0]);
 const legR=mesh(new THREE.BoxGeometry(.24,.68,.28),enemyAccent,g,[.18,.38,0]);
 g.userData={torso,legL,legR,phase:Math.random()*6,health:3,hit:0};
 enemies.push(g);return g;
}
const player={pos:new THREE.Vector3(0,1.68,21),yaw:0,pitch:0,health:100,ammo:30,reserve:180,kills:0,started:false,paused:false,ended:false,reloading:false,shooting:false,damageTimer:0,spawnTimer:1.2,fireCooldown:0,walk:0,spawned:0};
camera.position.copy(player.pos);camera.rotation.set(player.pitch,player.yaw,0);
const keys={};
const raycaster=new THREE.Raycaster();
let audio=null, pointerLocked=false;
const audioContext=()=>{if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();return audio;};
function tone(freq,duration,type='square',volume=.035){const a=audioContext(),osc=a.createOscillator(),gain=a.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,a.currentTime);osc.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.45),a.currentTime+duration);gain.gain.setValueAtTime(volume,a.currentTime);gain.gain.exponentialRampToValueAtTime(.001,a.currentTime+duration);osc.connect(gain);gain.connect(a.destination);osc.start();osc.stop(a.currentTime+duration);}
function showToast(text){const t=$('toast');t.textContent=text;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),900);}
function updateHUD(){
 $('health-value').innerHTML=`${Math.ceil(player.health)}<span>%</span>`;$('health-bar').style.width=`${player.health}%`;
 $('health-bar').style.background=player.health<30?'#df6654':'#c8d95b';
 $('ammo').textContent=player.reloading?'···':player.ammo;
 $('kills').innerHTML=`${player.kills} <small>/ 12</small>`;$('objective-progress').style.width=`${Math.min(100,player.kills/12*100)}%`;
 $('heading').textContent=`${['N','NE','E','SE','S','SW','W','NW'][Math.round((player.yaw%(Math.PI*2)+Math.PI*2)%(Math.PI*2)/(Math.PI/4))%8]} ${String(Math.round((player.yaw*180/Math.PI+360)%360)).padStart(3,'0')}°`;
}
function startMission(){
 if(player.ended)resetMission();
 player.started=true;player.paused=false;$('overlay').classList.add('hidden');$('pause-overlay').classList.add('hidden');
 if(enemies.length===0&&player.spawned===0){
  [[-15,-16],[14,-19],[-17,2],[17,10]].forEach(([x,z])=>{makeEnemy(x,z);player.spawned++;});
 }
 if(!touchDevice&&canvas.requestPointerLock)canvas.requestPointerLock();
 audioContext();
}
function setPaused(value){if(!player.started||player.ended)return;player.paused=value;$('pause-overlay').classList.toggle('hidden',!value);if(value&&document.pointerLockElement)document.exitPointerLock();else if(!value&&!touchDevice)canvas.requestPointerLock?.();}
function finishMission(won){
 player.ended=true;player.started=false;if(document.pointerLockElement)document.exitPointerLock();
 $('end-kicker').textContent=won?'MISSION COMPLETE':'MISSION FAILED';$('end-title').innerHTML=won?'OUTPOST<br><em>SECURED.</em>':'OPERATOR<br><em>DOWN.</em>';
 $('end-copy').textContent=won?'Area secure. The relay is back online. Clean work, operator.':'You were overwhelmed in the dust. Regroup and take the outpost.';
 $('final-kills').textContent=`${player.kills} / 12`;$('final-health').textContent=`${Math.max(0,Math.ceil(player.health))}%`;$('final-status').textContent=won?'MISSION COMPLETE':'MISSION FAILED';$('end-overlay').classList.remove('hidden');
}
function resetMission(){
 for(const e of enemies)scene.remove(e);enemies.length=0;player.pos.set(0,1.68,21);player.yaw=0;player.pitch=0;player.health=100;player.ammo=30;player.reserve=180;player.kills=0;player.ended=false;player.reloading=false;player.spawnTimer=.8;player.spawned=0;player.damageTimer=0;player.fireCooldown=0;
 $('end-overlay').classList.add('hidden');camera.position.copy(player.pos);camera.rotation.set(0,player.yaw,0);updateHUD();
}
function reload(){if(!player.started||player.paused||player.reloading||player.ammo===30||player.reserve<=0)return;player.reloading=true;showToast('RELOADING');tone(350,.12,'triangle',.015);setTimeout(()=>{if(player.ended)return;const n=Math.min(30-player.ammo,player.reserve);player.ammo+=n;player.reserve-=n;player.reloading=false;updateHUD();tone(520,.08,'triangle',.012);},1050);}
function shoot(){
 if(!player.started||player.paused||player.ended||player.reloading||player.fireCooldown>0)return;
 if(player.ammo<=0){showToast('MAGAZINE EMPTY');tone(170,.05,'square',.018);player.fireCooldown=.22;return;}
 player.ammo--;player.fireCooldown=.16;player.walk+=.3;rifle.position.z=.12;rifle.rotation.x=-.04;muzzleFlash.intensity=8;
 setTimeout(()=>{rifle.position.z=0;rifle.rotation.x=0;muzzleFlash.intensity=0;},55);
 tone(100,.12,'sawtooth',.045);tone(720,.045,'square',.014);
 raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
 const targets=[];for(const e of enemies)if(e.visible)targets.push(...e.children);
 const hit=raycaster.intersectObjects(targets,false)[0];
 if(hit){const e=hit.object.parent;e.userData.health--;e.userData.hit=.15;
  const marker=$('hit-marker');marker.classList.remove('pop');void marker.offsetWidth;marker.classList.add('pop');
  if(e.userData.health<=0){e.visible=false;player.kills++;showToast(player.kills===12?'OUTPOST SECURED':'HOSTILE DOWN');tone(490,.13,'triangle',.025);updateHUD();if(player.kills>=12)finishMission(true);}
 }
 updateHUD();
}
$('start-button').addEventListener('click',startMission);$('resume-button').addEventListener('click',()=>setPaused(false));$('pause-button').addEventListener('click',()=>setPaused(!player.paused));$('reload-button').addEventListener('click',reload);$('touch-reload').addEventListener('click',reload);
$('again-button').addEventListener('click',()=>{resetMission();startMission();});
canvas.addEventListener('click',()=>{if(!touchDevice&&player.started&&!player.paused){if(!pointerLocked)canvas.requestPointerLock?.();else shoot();}});
document.addEventListener('pointerlockchange',()=>{pointerLocked=document.pointerLockElement===canvas;});
document.addEventListener('mousemove',e=>{if(pointerLocked&&player.started&&!player.paused){player.yaw-=e.movementX*.0022;player.pitch=Math.max(-.65,Math.min(.48,player.pitch-e.movementY*.0018));}});
document.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='KeyR')reload();if(e.code==='Escape'&&player.started&&!player.ended)setPaused(!player.paused);});
document.addEventListener('keyup',e=>{keys[e.code]=false;});
document.addEventListener('mousedown',e=>{if(e.button===0&&pointerLocked)shoot();});
let fireInterval=null;
$('fire-button').addEventListener('pointerdown',e=>{e.preventDefault();player.shooting=true;shoot();fireInterval=setInterval(shoot,170);});
for(const ev of ['pointerup','pointercancel','pointerleave'])$('fire-button').addEventListener(ev,()=>{player.shooting=false;clearInterval(fireInterval);});
let stickPointer=null,stickVector={x:0,y:0};
const stickZone=$('stick-zone'),stickKnob=$('stick-knob');
function moveStick(e){const r=stickZone.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),len=Math.hypot(dx,dy),max=34,scale=len>max?max/len:1;stickVector={x:dx*scale/max,y:dy*scale/max};stickKnob.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;}
stickZone.addEventListener('pointerdown',e=>{e.preventDefault();stickPointer=e.pointerId;stickZone.setPointerCapture(e.pointerId);moveStick(e);});
stickZone.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)moveStick(e);});
function releaseStick(){stickPointer=null;stickVector={x:0,y:0};stickKnob.style.transform='translate(0,0)';}
stickZone.addEventListener('pointerup',releaseStick);stickZone.addEventListener('pointercancel',releaseStick);
let lookPointer=null,lastLook={x:0,y:0};
$('look-zone').addEventListener('pointerdown',e=>{if(!player.started)return;lookPointer=e.pointerId;lastLook={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);});
$('look-zone').addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer)return;const dx=e.clientX-lastLook.x,dy=e.clientY-lastLook.y;lastLook={x:e.clientX,y:e.clientY};player.yaw-=dx*.006;player.pitch=Math.max(-.65,Math.min(.48,player.pitch-dy*.0045));});
$('look-zone').addEventListener('pointerup',()=>lookPointer=null);$('look-zone').addEventListener('pointercancel',()=>lookPointer=null);

function blockedAt(x,z){
 if(Math.abs(x)>31||Math.abs(z)>35)return true;
 // The two wire-fence sides bound the playable perimeter; leave the ends open.
 if(Math.abs(x)>17.4&&Math.abs(x)<19.2&&z>-18.5&&z<18.5)return true;
 return structures.some(s=>Math.abs(x-s.x)<s.w/2+.48&&Math.abs(z-s.z)<s.d/2+.48);
}
function damagePlayer(amount){
 if(player.ended)return;
 player.health=Math.max(0,player.health-amount);player.damageTimer=.22;
 $('damage-flash').classList.add('active');window.setTimeout(()=>$('damage-flash').classList.remove('active'),120);
 updateHUD();tone(145,.11,'sawtooth',.025);
 if(player.health<=0)finishMission(false);
}
function spawnEnemy(){
 const candidates=[[-16,-17],[15,-18],[-18,-2],[18,5],[-14,15],[14,17],[-23,8],[23,-8]];
 let point=candidates[Math.floor(Math.random()*candidates.length)];
 for(let tries=0;tries<12;tries++){
  const c=candidates[Math.floor(Math.random()*candidates.length)];
  if(!structures.some(s=>Math.abs(c[0]-s.x)<s.w/2+1&&Math.abs(c[1]-s.z)<s.d/2+1)){point=c;break;}
 }
 const e=makeEnemy(point[0],point[1]);e.userData.attackTimer=1+Math.random()*1.5;player.spawned++;
}
function updateEnemies(dt,time){
 let alive=0;
 for(const e of enemies){
  if(!e.visible)continue;
  alive++;
  const data=e.userData,dx=player.pos.x-e.position.x,dz=player.pos.z-e.position.z,dist=Math.hypot(dx,dz);
  data.phase+=dt*(dist>3?7:2);
  data.legL.rotation.x=Math.sin(data.phase)*.42;
  data.legR.rotation.x=-Math.sin(data.phase)*.42;
  e.rotation.y=Math.atan2(dx,dz);
  if(data.hit>0){data.hit-=dt;if(data.hit<=0)data.torso.material=enemyMat;}
  if(dist>7.5){
   const speed=dist>15?1.35:.82;
   const nx=e.position.x+dx/dist*speed*dt,nz=e.position.z+dz/dist*speed*dt;
   if(!blockedAt(nx,nz)){e.position.x=nx;e.position.z=nz;}
  }else if(dist>2.2){
   const strafe=Math.sin(time*.8+data.phase)*.24*dt;
   const nx=e.position.x+dx/dist*strafe,nz=e.position.z-dz/dist*strafe;
   if(!blockedAt(nx,nz)){e.position.x=nx;e.position.z=nz;}
  }
  data.attackTimer-=dt;
  if(dist<24&&data.attackTimer<=0){
   data.attackTimer=1.55+Math.random()*1.05;
   if(Math.random()<Math.min(.82,.58+(24-dist)*.012))damagePlayer(5+Math.floor(Math.random()*5));
  }
 }
 if(player.spawned<12&&alive<4){
  player.spawnTimer-=dt;
  if(player.spawnTimer<=0){spawnEnemy();player.spawnTimer=1.7+Math.random()*1.2;}
 }else player.spawnTimer=1;
}
let lastTime=performance.now(),elapsed=0;
function frame(now){
 requestAnimationFrame(frame);
 const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;elapsed+=dt;
 if(player.started&&!player.paused&&!player.ended){
  player.fireCooldown=Math.max(0,player.fireCooldown-dt);
  let forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-stickVector.y;
  let strafe=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+stickVector.x;
  const length=Math.hypot(forward,strafe);if(length>1){forward/=length;strafe/=length;}
  const speed=5.1*dt,fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw),rx=Math.cos(player.yaw),rz=-Math.sin(player.yaw);
  const nx=player.pos.x+(fx*forward+rx*strafe)*speed,nz=player.pos.z+(fz*forward+rz*strafe)*speed;
  if(!blockedAt(nx,player.pos.z))player.pos.x=nx;
  if(!blockedAt(player.pos.x,nz))player.pos.z=nz;
  if(length>.05)player.walk+=dt*10;
  camera.position.set(player.pos.x,player.pos.y+(length>.05?Math.sin(player.walk)*.025:0),player.pos.z);
  camera.rotation.set(player.pitch,player.yaw,0,'YXZ');
  rifle.position.y=Math.sin(player.walk)*.012;
  updateEnemies(dt,elapsed);
 }
 renderer.render(scene,camera);
}
window.addEventListener('resize',()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,touchDevice?1.5:2));renderer.setSize(innerWidth,innerHeight);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&player.started&&!player.paused)setPaused(true);});
updateHUD();requestAnimationFrame(frame);
