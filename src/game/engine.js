import { ENEMY_TYPES, PLAYER_CFG, WAVES } from "./core/constants";
import { clamp, lerp } from "./core/math";

export function initGame(mountRef, G, setUi) {
    const THREE = window.THREE;
    const el = mountRef.current;
    const W = el.clientWidth, H = el.clientHeight;
    G._timeouts = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      G._timeouts.push(id);
      return id;
    };

    // ── Audio ──────────────────────────────────────────────────────────────
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const noise = (dur, vol, freq, type="bandpass", decay=2.5) => {
      try {
        const buf = actx.createBuffer(1, actx.sampleRate*dur, actx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length, decay);
        const src=actx.createBufferSource(); src.buffer=buf;
        const g=actx.createGain(); g.gain.setValueAtTime(vol,actx.currentTime); g.gain.exponentialRampToValueAtTime(0.01,actx.currentTime+dur);
        const f=actx.createBiquadFilter(); f.type=type; f.frequency.value=freq;
        src.connect(f); f.connect(g); g.connect(actx.destination); src.start();
      } catch(e){}
    };
    const tone = (f1,f2,dur,vol,type="sine") => {
      try {
        const o=actx.createOscillator(), g=actx.createGain();
        o.type=type; o.frequency.setValueAtTime(f1,actx.currentTime); o.frequency.exponentialRampToValueAtTime(f2,actx.currentTime+dur);
        g.gain.setValueAtTime(vol,actx.currentTime); g.gain.exponentialRampToValueAtTime(0.01,actx.currentTime+dur);
        o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime+dur);
      } catch(e){}
    };
    G.sfx = {
      shot:      ()=>noise(0.11, 0.38, 900),
      shotgun:   ()=>{ noise(0.09,0.5,350,"lowpass",1.8); noise(0.06,0.25,1300); },
      sniper:    ()=>noise(0.28, 0.6, 1500, "bandpass", 3),
      hit:       ()=>tone(260,75,0.12,0.28),
      playerHit: ()=>tone(110,50,0.24,0.5,"sawtooth"),
      explosion: ()=>noise(0.65, 0.75, 160, "lowpass", 1.5),
      bigBoom:   ()=>{ noise(0.9,0.8,100,"lowpass",1.2); later(()=>noise(0.4,0.4,200,"lowpass",2),250); },
      grenade:   ()=>later(()=>{ noise(0.75,0.78,130,"lowpass",1.4); },820),
      reload:    ()=>{ tone(420,880,0.14,0.18); later(()=>tone(660,1320,0.1,0.12),190); },
      dodge:     ()=>tone(320,180,0.12,0.15,"square"),
      levelUp:   ()=>{ [440,554,660,880].forEach((f,i)=>later(()=>tone(f,f*1.08,0.2,0.22),i*130)); },
      drone:     ()=>tone(900,900,0.05,0.08,"square"),
      airstrike: ()=>{ noise(0.3,0.45,700); later(()=>G.sfx.bigBoom(),380); },
    };

    // ── Scene ──────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x6e96b4);
    scene.fog = new THREE.Fog(0x6e96b4, 30, 60);
    G.scene = scene;

    const camera = new THREE.PerspectiveCamera(54, W/H, 0.1, 100);
    camera.position.set(0,18,12); camera.lookAt(0,0,0);
    G.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true;
    el.appendChild(renderer.domElement);
    G.renderer = renderer;

    scene.add(new THREE.AmbientLight(0xfff4e0, 0.62));
    const sun = new THREE.DirectionalLight(0xfff8e8, 1.4);
    sun.position.set(15,26,10); sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);
    ["left","right","top","bottom"].forEach((k,i)=>sun.shadow.camera[k]=[-28,28,28,-28][i]);
    sun.shadow.camera.far=80; scene.add(sun);

    // ── Map building helpers ───────────────────────────────────────────────
    G.walls   = [];   // {x,z,hw,hd} axis-aligned boxes for sweep collision
    G.covers  = [];   // same list — walls that block LOS
    G.barrels = [];
    const lmat = c => new THREE.MeshLambertMaterial({color:c});

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(64,64), lmat(0x4a6224));
    ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

    // Dirt patches
    for(let i=0;i<22;i++){
      const p=new THREE.Mesh(new THREE.CircleGeometry(Math.random()*1.4+0.2,7), lmat(0x7a6040));
      p.rotation.x=-Math.PI/2; p.position.set((Math.random()-.5)*58,.01,(Math.random()-.5)*58); scene.add(p);
    }

    // Roads
    [[3.5,64,0],[64,3.5,0]].forEach(([w,l],i)=>{
      const r=new THREE.Mesh(new THREE.PlaneGeometry(w,l),lmat(0x353528));
      r.rotation.x=-Math.PI/2; r.position.y=.02; if(i) r.rotation.z=Math.PI/2; scene.add(r);
    });

    function registerWall(x,z,hw,hd){ G.walls.push({x,z,hw,hd}); G.covers.push({x,z,hw,hd}); }

    function addBuilding(x,z,w,d,h,col){
      const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),lmat(col));
      m.position.set(x,h/2,z); m.castShadow=m.receiveShadow=true; scene.add(m);
      registerWall(x,z,w/2,d/2);
      const roof=new THREE.Mesh(new THREE.BoxGeometry(w+.35,.22,d+.35),lmat(0x1c1c12));
      roof.position.set(x,h+.11,z); scene.add(roof);
      // window squares
      [[w/2+.01,h*.58,0,0,Math.PI/2],[-(w/2+.01),h*.58,0,0,-Math.PI/2],[0,h*.58,d/2+.01,0,0],[0,h*.58,-(d/2+.01),0,Math.PI]].forEach(([ox,oy,oz,rx,ry])=>{
        const win=new THREE.Mesh(new THREE.PlaneGeometry(.65,.45),lmat(0x1e3a55));
        win.position.set(x+ox,oy,z+oz); win.rotation.y=ry; scene.add(win);
      });
    }

    addBuilding(-9,-7, 4.5,3.5,3.5,0x7a7a6a); addBuilding( 8,-6, 3.5,4,4,   0x8a8272);
    addBuilding(-8, 6, 5,  3,  3,   0x7a7060); addBuilding( 9, 7, 4, 4, 3.5, 0x6a6a5a);
    addBuilding( 0,-11,5,  3,  2.5, 0x8a8272); addBuilding(-3,10, 5.5,2.5,3, 0x7a7a6a);
    addBuilding(11, 0, 3,  5,  3.2, 0x6a6a5a); addBuilding(-11,1, 3, 4.5,2.8,0x7a7060);
    addBuilding(-5,-14,3,  2.5,2,   0x808070); addBuilding( 5, 14,3, 2.5,2,  0x7a7060);

    function addSandbag(x,z,ry){
      const g=new THREE.Group();
      for(let row=0;row<2;row++) for(let i=0;i<3-row;i++){
        const b=new THREE.Mesh(new THREE.SphereGeometry(.28,6,4),lmat(row?0xb09440:0xc2a45a));
        b.position.set((i-(1-row)*.5)*.52,.28+row*.38,0); b.scale.set(1,.6,.85); b.castShadow=true; g.add(b);
      }
      g.position.set(x,0,z); g.rotation.y=ry; scene.add(g);
      registerWall(x,z,.9,.4);
    }
    [[-3,1,0],[3,-2,1.05],[-1,-5,-.8],[4,4,1.2],[0,6,.5],[-6,0,.3],[5,-6,-.6],[2,8,1.8],[-7,-3,.9],[7,3,-.4]].forEach(([x,z,r])=>addSandbag(x,z,r));

    function addTree(x,z){
      const g=new THREE.Group();
      const tr=new THREE.Mesh(new THREE.CylinderGeometry(.12,.18,1.6,6),lmat(0x4a3020));
      tr.position.y=.8; tr.castShadow=true; g.add(tr);
      [{y:2.2,r:1.0},{y:3.1,r:.7},{y:3.8,r:.42}].forEach(({y,r})=>{
        const f=new THREE.Mesh(new THREE.ConeGeometry(r,1.3,7),lmat(0x226010));
        f.position.y=y; f.castShadow=true; g.add(f);
      });
      g.position.set(x,0,z); scene.add(g);
      registerWall(x,z,.3,.3);
    }
    [-12,-11,10,11,-6,6].forEach((v,i)=>addTree(v,i%2?10:-10));
    [[-14,4],[14,-4],[0,15],[0,-16],[-14,-6],[14,6],[-8,-12],[8,12]].forEach(([x,z])=>addTree(x,z));

    function addCrate(x,z,col=0x8a6a2a){
      const c=new THREE.Mesh(new THREE.BoxGeometry(.85,.85,.85),lmat(col));
      c.position.set(x,.43,z); c.castShadow=true; scene.add(c);
      registerWall(x,z,.48,.48);
    }
    [[4,1],[-4,-3],[2,-7],[-7,4],[8,3],[3,9],[-2,-11],[6,-9],[-9,8]].forEach(([x,z])=>addCrate(x,z));

    // Watchtower
    function addTower(x,z){
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([ox,oz])=>{
        const l=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,4.2,6),lmat(0x6a5030));
        l.position.set(x+ox*.5,2.1,z+oz*.5); l.castShadow=true; scene.add(l);
      });
      const pl=new THREE.Mesh(new THREE.BoxGeometry(2.4,.22,2.4),lmat(0x5a4020));
      pl.position.set(x,4.22,z); pl.castShadow=true; scene.add(pl);
      registerWall(x,z,1.2,1.2);
    }
    addTower(-13,-11); addTower(13,11);

    // Explosive barrels
    [[-5,-5],[5,3],[-2,-8],[6,-1],[0,4],[-8,-3],[3,-11],[-6,8]].forEach(([x,z])=>{
      const g=new THREE.Group();
      const body=new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.72,8),lmat(0xbb2200));
      body.position.y=.36; body.castShadow=true; g.add(body);
      const top=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.06,8),lmat(0x303030));
      top.position.y=.75; g.add(top);
      // X hazard stripe
      const stripe=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.12,8),lmat(0x222222));
      stripe.position.y=.52; g.add(stripe);
      g.position.set(x,.01,z); scene.add(g);
      G.barrels.push({mesh:g,x,z,alive:true});
      registerWall(x,z,.32,.32);
    });

    // ── Soldier mesh factory ───────────────────────────────────────────────
    function makeSoldier(isPlayer, type="rifleman"){
      const cfg=ENEMY_TYPES[type]||ENEMY_TYPES.rifleman;
      const baseCol=isPlayer?0x3a5820:cfg.col, hCol=isPlayer?0x2a4010:cfg.hCol;
      const g=new THREE.Group();
      const scale=(type==="heavy")?1.28:1; g.scale.setScalar(scale);

      const lm=c=>new THREE.MeshLambertMaterial({color:c});
      [-0.14,0.14].forEach(ox=>{
        const leg=new THREE.Mesh(new THREE.BoxGeometry(.17,.52,.17),lm(0x1a1a0e));
        leg.position.set(ox,.26,0); leg.castShadow=true; leg.name=ox<0?"legL":"legR"; g.add(leg);
      });
      const body=new THREE.Mesh(new THREE.BoxGeometry(.48,.52,.24),lm(baseCol));
      body.position.y=.72; body.castShadow=true; g.add(body);
      const vest=new THREE.Mesh(new THREE.BoxGeometry(.4,.32,.27),lm(isPlayer?0x2a3a1a:0x262616));
      vest.position.y=.72; g.add(vest);
      [-0.34,0.34].forEach(ox=>{
        const arm=new THREE.Mesh(new THREE.BoxGeometry(.14,.44,.14),lm(baseCol));
        arm.position.set(ox,.66,0); arm.castShadow=true; arm.name=ox<0?"armL":"armR"; g.add(arm);
      });
      const head=new THREE.Mesh(new THREE.BoxGeometry(.28,.27,.26),lm(0xc8a882));
      head.position.y=1.12; head.castShadow=true; g.add(head);
      const helm=new THREE.Mesh(new THREE.SphereGeometry(.19,8,6),lm(hCol));
      helm.position.y=1.27; helm.scale.set(1.1,.75,1.1); g.add(helm);
      const brim=new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.04,8),lm(hCol));
      brim.position.set(0,1.18,.04); g.add(brim);
      const gun=new THREE.Mesh(new THREE.BoxGeometry(.07,.07,type==="sniper"?.75:.52),lm(0x111111));
      gun.position.set(.32,.68,-.28); gun.name="gun"; g.add(gun);
      const muzzle=new THREE.Mesh(new THREE.SphereGeometry(.09,6,6),new THREE.MeshBasicMaterial({color:0xffdd44,transparent:true,opacity:0}));
      muzzle.position.set(.32,.68,type==="sniper"?-.72:-.58); muzzle.name="muzzle"; g.add(muzzle);

      if(type==="sniper"){
        const lz=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,14,4),new THREE.MeshBasicMaterial({color:0xff0000,transparent:true,opacity:0}));
        lz.rotation.x=Math.PI/2; lz.position.set(.32,.68,-7.72); lz.name="laser"; g.add(lz);
      }
      if(type==="heavy"){
        const sh=new THREE.Mesh(new THREE.BoxGeometry(.62,.84,.09),lm(0x334466));
        sh.position.set(-.38,.72,-.12); g.add(sh);
      }
      return g;
    }

    // ── Collision helpers ──────────────────────────────────────────────────
    function collidesWall(x,z,r=0.38){
      for(let i=0;i<G.walls.length;i++){
        const w=G.walls[i];
        if(Math.abs(x-w.x)<w.hw+r && Math.abs(z-w.z)<w.hd+r) return true;
      }
      return false;
    }
    function sweptHit(p0,p1,target,radius){
      const dx=p1.x-p0.x, dy=p1.y-p0.y, dz=p1.z-p0.z;
      const fx=p0.x-target.x, fy=p0.y-target.y, fz=p0.z-target.z;
      const a=dx*dx+dy*dy+dz*dz;
      if(a<1e-5) return (fx*fx+fy*fy+fz*fz)<radius*radius;
      const b=2*(fx*dx+fy*dy+fz*dz);
      const c=(fx*fx+fy*fy+fz*fz)-radius*radius;
      const disc=b*b-4*a*c; if(disc<0) return false;
      const sq=Math.sqrt(disc), t1=(-b-sq)/(2*a), t2=(-b+sq)/(2*a);
      return (t1>=0&&t1<=1)||(t2>=0&&t2<=1);
    }
    // Line-of-sight: does a wall block from src→dst?
    function hasLOS(src,dst){
      const dir=new THREE.Vector3().subVectors(dst,src);
      const dist=dir.length(); if(dist<0.1) return true;
      dir.normalize();
      // sample 6 points along ray
      for(let t=0.5;t<dist-0.5;t+=dist/6){
        const x=src.x+dir.x*t, z=src.z+dir.z*t;
        for(let i=0;i<G.walls.length;i++){
          const w=G.walls[i];
          if(Math.abs(x-w.x)<w.hw+.1&&Math.abs(z-w.z)<w.hd+.1) return false;
        }
      }
      return true;
    }

    const V_TMP1 = new THREE.Vector3();
    const V_TMP2 = new THREE.Vector3();
    const V_TMP3 = new THREE.Vector3();
    const V_TMP4 = new THREE.Vector3();
    const V_TMP5 = new THREE.Vector3();
    const V_TMP6 = new THREE.Vector3();
    const V_TMP7 = new THREE.Vector3();
    const MOUSE_AIM_ASSIST_ANGLE = 0.42;

    function getNearestAliveEnemy(pos){
      let nearest=null, nearestDist=Infinity;
      for(let i=0;i<G.enemies.length;i++){
        const e=G.enemies[i];
        if(!e.alive) continue;
        const d=pos.distanceTo(e.mesh.position);
        if(d<nearestDist){ nearestDist=d; nearest=e; }
      }
      return nearest;
    }

    function getMouseAssistedEnemy(pos, mouseWorld, maxRange=13){
      V_TMP7.subVectors(mouseWorld, pos);
      V_TMP7.y = 0;
      if(V_TMP7.lengthSq() < 1e-4) return null;
      V_TMP7.normalize();

      let best=null;
      let bestAngle=Infinity;
      let bestDist=Infinity;
      for(let i=0;i<G.enemies.length;i++){
        const e=G.enemies[i];
        if(!e.alive) continue;
        const d = pos.distanceTo(e.mesh.position);
        if(d > maxRange) continue;
        V_TMP6.subVectors(e.mesh.position, pos);
        V_TMP6.y = 0;
        if(V_TMP6.lengthSq() < 1e-4) continue;
        V_TMP6.normalize();
        const dot = Math.max(-1, Math.min(1, V_TMP7.dot(V_TMP6)));
        const angle = Math.acos(dot);
        if(angle > MOUSE_AIM_ASSIST_ANGLE) continue;
        if(angle < bestAngle || (Math.abs(angle-bestAngle) < 0.02 && d < bestDist)){
          best=e;
          bestAngle=angle;
          bestDist=d;
        }
      }
      return best;
    }

    function countAliveEnemies(){
      let alive=0;
      for(let i=0;i<G.enemies.length;i++) if(G.enemies[i].alive) alive++;
      return alive;
    }

    // ── Particle / spawn helpers ───────────────────────────────────────────
    function spawnParticle(pos,vel,col,life=26,sz=.07){
      const m=new THREE.Mesh(new THREE.SphereGeometry(sz,4,4),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:1}));
      m.position.copy(pos); scene.add(m);
      G.particles.push({mesh:m,vel:vel.clone(),life,maxLife:life});
    }
    function spawnImpact(pos,col=0xff2200,n=10){
      for(let i=0;i<n;i++){
        const v=new THREE.Vector3((Math.random()-.5)*.22,Math.random()*.18+.04,(Math.random()-.5)*.22);
        spawnParticle(pos.clone().add(new THREE.Vector3(0,.7,0)),v,col,22,.06);
      }
    }
    function spawnDeathBurst(pos){
      for(let i=0;i<22;i++){
        const a=(i/22)*Math.PI*2;
        const v=new THREE.Vector3(Math.cos(a)*.18,Math.random()*.22+.08,Math.sin(a)*.18);
        spawnParticle(pos.clone().add(new THREE.Vector3(0,.5,0)),v,i%2?0xff2200:0xff8800,42,.09);
      }
    }
    function spawnExplosion(pos,radius=4.5,dmg=70){
      G.sfx.bigBoom();
      // shockwave
      for(let i=0;i<36;i++){
        const a=(i/36)*Math.PI*2;
        const v=new THREE.Vector3(Math.cos(a)*radius*.2,Math.random()*.32+.08,Math.sin(a)*radius*.2);
        const col=[0xffffff,0xff8800,0xff3300][i%3];
        spawnParticle(pos.clone(),v,col,38,.12);
      }
      // flash sphere
      const flash=new THREE.Mesh(new THREE.SphereGeometry(radius*.55,8,8),new THREE.MeshBasicMaterial({color:0xff9900,transparent:true,opacity:.85}));
      flash.position.copy(pos); scene.add(flash);
      G.particles.push({mesh:flash,vel:new THREE.Vector3(),life:7,maxLife:7});

      // damage enemies
      G.enemies.forEach(e=>{
        if(!e.alive) return;
        const d=e.mesh.position.distanceTo(pos);
        if(d<radius){ e.hp-=dmg*(1-d/radius); e.hitFlash=14; if(e.hp<=0&&e.deathTimer<0) killEnemy(e); }
      });
      // damage player (less)
      const P=G.player;
      const pd=P.mesh.position.distanceTo(pos);
      if(pd<radius&&P.iFrames<=0) damagePlayer(dmg*.45*(1-pd/radius), pos);

      // barrel chain reactions
      G.barrels.forEach(bar=>{
        if(!bar.alive) return;
        if(bar.mesh.position.distanceTo(pos)<radius+1.5){
          bar.alive=false; scene.remove(bar.mesh);
          G.walls=G.walls.filter(w=>!(Math.abs(w.x-bar.x)<.15&&Math.abs(w.z-bar.z)<.15));
          later(()=>spawnExplosion(bar.mesh.position.clone(),4,55), 200+Math.random()*300);
        }
      });
    }

    // ── Player setup ───────────────────────────────────────────────────────
    const pm=makeSoldier(true);
    const playerLegL=pm.getObjectByName("legL");
    const playerLegR=pm.getObjectByName("legR");
    const playerMuzzle=pm.getObjectByName("muzzle");
    scene.add(pm);
    G.player = {
      mesh:pm,
      // physics state
      vel: new THREE.Vector3(),   // current velocity (x,z used; y=0 for ground)
      facing: 0,                  // rotation.y
      knockback: new THREE.Vector3(),
      // stats
      hp:PLAYER_CFG.maxHp, maxHp:PLAYER_CFG.maxHp,
      armor:PLAYER_CFG.maxArmor, maxArmor:PLAYER_CFG.maxArmor,
      ammo:PLAYER_CFG.maxAmmo, maxAmmo:PLAYER_CFG.maxAmmo,
      grenades:PLAYER_CFG.maxGrenades,
      // timers
      shootTimer:0, reloadTimer:0,
      iFrames:0, stumbleTimer:0,
      dodgeTimer:0, dodgeDirX:0, dodgeDirZ:0,
      bobT:0,
      // cooldowns
      airstrikeTimer:0, droneTimer:0,
      // flags
      alive:true, reloading:false, dodging:false,
      legL:playerLegL, legR:playerLegR, muzzle:playerMuzzle,
    };

    G.bullets   = [];
    G.eBullets  = [];
    G.particles = [];
    G.grenades  = [];

    // ── Kill / damage helpers ──────────────────────────────────────────────
    function killEnemy(e){
      e.alive=false; e.deathTimer=48; e.deathRotTarget=(Math.random()>.5?1:-1)*Math.PI/2;
      spawnDeathBurst(e.mesh.position);
      const alive=countAliveEnemies();
      setUi(u=>{
        const now=Date.now();
        const newCombo=(now-(u.lastKill||0)<3200)?u.combo+1:1;
        return {...u,score:u.score+e.cfg.score+Math.max(0,newCombo-1)*50,enemies:alive,combo:newCombo,kills:u.kills+1,lastKill:now};
      });
      if(alive===0) nextWave();
    }

    function damagePlayer(rawDmg, srcPos){
      const P=G.player;
      let dmg=rawDmg;
      if(P.dodging) dmg*=.15;          // dodging = near invincible
      if(P.armor>0){
        const blocked=Math.min(P.armor,dmg*.55); P.armor=Math.max(0,P.armor-blocked); dmg-=blocked;
      }
      P.hp=Math.max(0,P.hp-dmg);
      P.iFrames=28; P.stumbleTimer=12;
      if(srcPos){
        V_TMP1.subVectors(P.mesh.position,srcPos).normalize();
        P.knockback.addScaledVector(V_TMP1,.12);   // additive knockback
      }
      spawnImpact(P.mesh.position,0xff5500);
      G.sfx.playerHit();
      setUi(u=>({...u,hp:Math.max(0,P.hp),armor:P.armor,flash:true}));
      later(()=>setUi(u=>({...u,flash:false})),190);
      if(P.hp<=0){ P.alive=false; G.gameState="over"; setUi(u=>({...u,state:"over"})); }
    }

    // ── Enemy spawning ─────────────────────────────────────────────────────
    G.enemies=[];
    function spawnEnemies(waveIdx){
      G.enemies.forEach(e=>scene.remove(e.mesh)); G.enemies=[];
      const wcfg=WAVES[Math.min(waveIdx,WAVES.length-1)];
      const positions=[[-7,-5],[7,-4],[-6,6],[7,6],[0,-8],[-9,2],[9,-2],[0,8],[-7,-9],[7,9],[4,-5],[-4,5],[10,4],[-10,-4],[0,-12],[5,11],[-5,-11]];
      let pi=0;
      wcfg.cfg.forEach(([type,count])=>{
        for(let i=0;i<count&&pi<positions.length;i++,pi++){
          const [ex,ez]=positions[pi];
          const ecfg=ENEMY_TYPES[type];
          const m=makeSoldier(false,type); m.position.set(ex,0,ez); scene.add(m);
          const emissiveMats=[];
          const fadeMats=[];
          m.traverse(c=>{
            if(!c.isMesh||!c.material) return;
            fadeMats.push(c.material);
            if(c.material.emissive) emissiveMats.push(c.material);
          });
          G.enemies.push({
            mesh:m, type, cfg:ecfg,
            hp:ecfg.hp, maxHp:ecfg.hp,
            vel:new THREE.Vector3(),
            knockback:new THREE.Vector3(),
            state:"patrol",
            patrolDir:new THREE.Vector3((Math.random()-.5),0,(Math.random()-.5)).normalize(),
            patrolTimer:60+Math.random()*60,
            shootTimer:Math.random()*ecfg.shootInt,
            hitFlash:0, deathTimer:-1, deathRotTarget:0,
            alive:true, droneMarked:0,
            strafeDir:1, strafeTimer:0,
            emissiveMats, fadeMats,
            muzzle:m.getObjectByName("muzzle"),
            laser:m.getObjectByName("laser"),
          });
        }
      });
      return G.enemies.length;
    }

    function nextWave(){
      G.wave++;
      if(G.wave>=WAVES.length){ G.gameState="win"; setUi(u=>({...u,state:"win"})); return; }
      G.sfx.levelUp();
      later(()=>{
        const cnt=spawnEnemies(G.wave);
        const wc=WAVES[G.wave];
        setUi(u=>({...u,wave:G.wave,enemies:cnt,waveLabel:wc.label,obj:wc.obj}));
      },2400);
    }

    // ── Input ──────────────────────────────────────────────────────────────
    G.joy={active:false,dx:0,dy:0,id:null,sx:0,sy:0};
    G.firing=false; G.keys={};
    G.fireInput={keyboard:false,mouse:false};
    G.mouse={
      active:false,
      ndc:new THREE.Vector2(),
      world:new THREE.Vector3(),
      hasWorld:false,
    };
    const raycaster = new THREE.Raycaster();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
    const syncFiring = ()=>{
      G.firing = G.fireInput.keyboard || G.fireInput.mouse;
    };
    const updateMouseAim = (clientX, clientY)=>{
      const rect=cv.getBoundingClientRect();
      const x=((clientX-rect.left)/rect.width)*2-1;
      const y=-((clientY-rect.top)/rect.height)*2+1;
      G.mouse.ndc.set(x,y);
      raycaster.setFromCamera(G.mouse.ndc, camera);
      if(raycaster.ray.intersectPlane(groundPlane, G.mouse.world)){
        G.mouse.hasWorld=true;
        G.mouse.active=true;
      }
    };

    const cv=renderer.domElement;

    const mm=e=>updateMouseAim(e.clientX, e.clientY);
    const md=e=>{
      if(e.button!==0) return;
      actx.resume();
      updateMouseAim(e.clientX, e.clientY);
      G.fireInput.mouse=true;
      syncFiring();
    };
    const mu=e=>{
      if(e.button!==0) return;
      G.fireInput.mouse=false;
      syncFiring();
    };
    const mctx=e=>e.preventDefault();
    cv.addEventListener("mousemove",mm);
    cv.addEventListener("mousedown",md);
    window.addEventListener("mouseup",mu);
    cv.addEventListener("contextmenu",mctx);

    const kd=e=>{
      G.keys[e.key.toLowerCase()]=true;
      if(e.key===" "){ G.fireInput.keyboard=true; syncFiring(); actx.resume(); }
      if(e.key.toLowerCase()==="shift") doDodge();
      if(e.key.toLowerCase()==="g")     throwGrenade();
      if(e.key.toLowerCase()==="q")     callAirstrike();
      if(e.key.toLowerCase()==="f")     callDrone();
    };
    const ku=e=>{
      G.keys[e.key.toLowerCase()]=false;
      if(e.key===" "){ G.fireInput.keyboard=false; syncFiring(); }
    };
    window.addEventListener("keydown",kd); window.addEventListener("keyup",ku);
    G._kd=kd; G._ku=ku;
    G._mm=mm; G._md=md; G._mu=mu; G._mctx=mctx;

    // ── Abilities ──────────────────────────────────────────────────────────
    function doDodge(){
      const P=G.player;
      if(!P.alive||G.gameState!=="playing"||P.dodging) return;
      let dx=0,dz=0;
      if(G.joy.active){dx=G.joy.dx;dz=G.joy.dy;}
      if(G.keys["w"]||G.keys["arrowup"])    dz-=1;
      if(G.keys["s"]||G.keys["arrowdown"])  dz+=1;
      if(G.keys["a"]||G.keys["arrowleft"])  dx-=1;
      if(G.keys["d"]||G.keys["arrowright"]) dx+=1;
      const len=Math.sqrt(dx*dx+dz*dz);
      if(len<0.1){dx=Math.sin(P.facing);dz=Math.cos(P.facing);} // dodge forward
      else{dx/=len;dz/=len;}
      P.dodging=true; P.dodgeTimer=PLAYER_CFG.dodgeDur;
      P.iFrames=PLAYER_CFG.dodgeIFrames;
      P.dodgeDirX=dx; P.dodgeDirZ=dz;
      G.sfx.dodge();
      setUi(u=>({...u,dodging:true}));
    }

    function throwGrenade(){
      const P=G.player;
      if(!P.alive||G.gameState!=="playing"||P.grenades<=0) return;
      const nearest=getNearestAliveEnemy(P.mesh.position);
      const dir=nearest?new THREE.Vector3().subVectors(nearest.mesh.position,P.mesh.position):new THREE.Vector3(Math.sin(P.facing),0,Math.cos(P.facing));
      const m=new THREE.Mesh(new THREE.SphereGeometry(.1,6,6),new THREE.MeshLambertMaterial({color:0x556633}));
      m.position.copy(P.mesh.position).add(new THREE.Vector3(0,.8,0));
      scene.add(m);
      const spd=.24, vel=dir.clone().normalize().multiplyScalar(spd); vel.y=.17;
      G.grenades.push({mesh:m,vel,life:58,bounces:0,exploded:false});
      G.sfx.grenade();
      P.grenades--; setUi(u=>({...u,grenades:P.grenades}));
    }

    function callAirstrike(){
      const P=G.player;
      if(!P.alive||G.gameState!=="playing"||P.airstrikeTimer>0) return;
      P.airstrikeTimer=580; setUi(u=>({...u,airstrikeReady:false}));
      G.sfx.airstrike();
      const nearest=getNearestAliveEnemy(P.mesh.position);
      const tgt=nearest?nearest.mesh.position.clone():P.mesh.position.clone().add(new THREE.Vector3(0,0,-5));
      [0,280,560,840].forEach(delay=>{
        later(()=>{
          const sp=new THREE.Vector3((Math.random()-.5)*4,0,(Math.random()-.5)*4);
          spawnExplosion(tgt.clone().add(sp),3.8,85);
        },delay);
      });
    }

    function callDrone(){
      const P=G.player;
      if(!P.alive||G.gameState!=="playing"||P.droneTimer>0) return;
      P.droneTimer=420; setUi(u=>({...u,droneReady:false}));
      G.sfx.drone();
      G.enemies.forEach(e=>{ if(e.alive) e.droneMarked=200; });
    }

    // Expose to UI buttons
    G.doDodge=doDodge; G.throwGrenade=throwGrenade; G.callAirstrike=callAirstrike; G.callDrone=callDrone;

    // ── Wave 0 ─────────────────────────────────────────────────────────────
    G.wave=0; G.gameState="menu";
    const ic=spawnEnemies(0);
    setUi(u=>({...u,enemies:ic,waveLabel:WAVES[0].label,obj:WAVES[0].obj}));

    // ── Main loop ──────────────────────────────────────────────────────────
    let lastTime=0;
    function animate(ts){
      G.animId=requestAnimationFrame(animate);
      const dt=Math.min((ts-lastTime)/16.7,2.5); lastTime=ts;
      renderer.render(scene,camera);
      if(G.gameState!=="playing") return;

      const P=G.player;
      if(!P.alive) return;

      // ── Cooldowns ────────────────────────────────────────────────────
      if(P.iFrames>0) P.iFrames-=dt;
      if(P.airstrikeTimer>0){ P.airstrikeTimer-=dt; if(P.airstrikeTimer<=0) setUi(u=>({...u,airstrikeReady:true})); }
      if(P.droneTimer>0)    { P.droneTimer-=dt;     if(P.droneTimer<=0)     setUi(u=>({...u,droneReady:true})); }

      // ── Stumble wobble ───────────────────────────────────────────────
      if(P.stumbleTimer>0){ P.stumbleTimer-=dt; P.mesh.rotation.z=Math.sin(P.stumbleTimer*1.3)*.22*(P.stumbleTimer/12); }
      else P.mesh.rotation.z*=.78;

      // ── Dodge roll ───────────────────────────────────────────────────
      // CHARACTER CONTROLLER STYLE: fast, snappy, predictable arc
      if(P.dodging){
        P.dodgeTimer-=dt;
        const t=1-P.dodgeTimer/PLAYER_CFG.dodgeDur;  // 0→1
        const spd=PLAYER_CFG.dodgeSpeed*(1-t*.6);    // decelerates through roll
        const nx=P.mesh.position.x+P.dodgeDirX*spd*dt;
        const nz=P.mesh.position.z+P.dodgeDirZ*spd*dt;
        if(!collidesWall(nx,P.mesh.position.z)&&Math.abs(nx)<22) P.mesh.position.x=nx;
        if(!collidesWall(P.mesh.position.x,nz)&&Math.abs(nz)<22) P.mesh.position.z=nz;
        P.mesh.rotation.x=Math.sin(t*Math.PI)*-.5;  // forward lean
        if(P.dodgeTimer<=0){ P.dodging=false; P.mesh.rotation.x=0; setUi(u=>({...u,dodging:false})); }
      } else {
        // ── Normal movement — Character Controller feel ───────────────
        let ix=0,iz=0;
        if(G.joy.active){ix=G.joy.dx;iz=G.joy.dy;}
        if(G.keys["w"]||G.keys["arrowup"])    iz-=1;
        if(G.keys["s"]||G.keys["arrowdown"])  iz+=1;
        if(G.keys["a"]||G.keys["arrowleft"])  ix-=1;
        if(G.keys["d"]||G.keys["arrowright"]) ix+=1;
        const ilen=Math.sqrt(ix*ix+iz*iz);
        if(ilen>0){ix/=ilen;iz/=ilen;}

        // Smooth acceleration / fast deceleration (no ice-skating)
        const targetVX=ix*PLAYER_CFG.walkSpeed;
        const targetVZ=iz*PLAYER_CFG.walkSpeed;
        const moving=ilen>0;
        const rate=moving?PLAYER_CFG.acceleration:PLAYER_CFG.deceleration;
        P.vel.x=lerp(P.vel.x,targetVX,rate*dt);
        P.vel.z=lerp(P.vel.z,targetVZ,rate*dt);

        // Apply knockback on top of controlled velocity
        if(P.knockback.length()>0.001){
          P.vel.x+=P.knockback.x*dt; P.vel.z+=P.knockback.z*dt;
          P.knockback.multiplyScalar(.68);
        }

        // Move with wall sliding
        const nx=P.mesh.position.x+P.vel.x*dt;
        const nz=P.mesh.position.z+P.vel.z*dt;
        if(!collidesWall(nx,P.mesh.position.z)&&Math.abs(nx)<22) P.mesh.position.x=nx;
        else P.vel.x*=-.2;
        if(!collidesWall(P.mesh.position.x,nz)&&Math.abs(nz)<22) P.mesh.position.z=nz;
        else P.vel.z*=-.2;

        // Facing direction — rotates toward movement direction
        if(moving){
          const tFacing=Math.atan2(ix,iz);
          // Shortest-path angle lerp
          let da=tFacing-P.facing;
          while(da> Math.PI) da-=Math.PI*2;
          while(da<-Math.PI) da+=Math.PI*2;
          P.facing+=da*0.22*dt;
          P.mesh.rotation.y=P.facing;
        }

        // Bob animation
        if(Math.abs(P.vel.x)+Math.abs(P.vel.z)>0.01){
          P.bobT+=0.22*dt;
          P.mesh.position.y=Math.abs(Math.sin(P.bobT))*.07;
          const legL=P.legL,legR=P.legR;
          if(legL) legL.rotation.x=Math.sin(P.bobT)*.48;
          if(legR) legR.rotation.x=-Math.sin(P.bobT)*.48;
        } else {
          P.mesh.position.y*=.85;
        }
      }

      // ── Smooth camera follow ─────────────────────────────────────────
      const tx=P.mesh.position.x, tz=P.mesh.position.z;
      const camLerp=0.09*dt;
      camera.position.x+=((tx)   -camera.position.x)*camLerp;
      camera.position.z+=((tz+12)-camera.position.z)*camLerp;
      camera.position.y=18;
      camera.lookAt(tx,0,tz);

      // ── Shooting — auto-target nearest enemy in range ────────────────
      P.shootTimer=Math.max(0,P.shootTimer-dt);
      if(P.reloading){ P.reloadTimer-=dt; if(P.reloadTimer<=0){ P.reloading=false; P.ammo=P.maxAmmo; setUi(u=>({...u,ammo:P.maxAmmo,reloading:false})); } }

      let nearest=getNearestAliveEnemy(P.mesh.position);
      if(G.mouse.active && G.mouse.hasWorld){
        const assisted = getMouseAssistedEnemy(P.mesh.position, G.mouse.world, 13);
        if(assisted) nearest=assisted;
      }
      const nd=nearest?P.mesh.position.distanceTo(nearest.mesh.position):Infinity;
      const autoFireByRange = !G.mouse.active && nearest && nd<5;
      const canFire=(G.firing||autoFireByRange) && !P.reloading && P.ammo>0 && P.shootTimer<=0 && nearest && nd<13 && !P.dodging;
      if(canFire){
        const dir=V_TMP1.subVectors(nearest.mesh.position,P.mesh.position);
        // Player auto-aims toward target for facing
        P.facing=Math.atan2(dir.x,dir.z); P.mesh.rotation.y=P.facing;
        // Spawn bullet
        const bm=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.42,4),new THREE.MeshBasicMaterial({color:0xffee44}));
        bm.rotation.x=Math.PI/2;
        const bpos=P.mesh.position.clone().add(new THREE.Vector3(0,.72,0));
        bm.position.copy(bpos); scene.add(bm);
        G.bullets.push({mesh:bm,prevPos:bpos.clone(),dir:dir.clone().normalize(),speed:.42,life:85,dmg:20});
        G.sfx.shot();
        P.ammo--; P.shootTimer=PLAYER_CFG.shootInterval;
        const muzzle=P.muzzle;
        if(muzzle){muzzle.material.opacity=1;later(()=>{if(muzzle)muzzle.material.opacity=0;},52);}
        setUi(u=>({...u,ammo:P.ammo}));
        if(P.ammo<=0){P.reloading=true;P.reloadTimer=PLAYER_CFG.reloadTime;G.sfx.reload();setUi(u=>({...u,reloading:true}));}
      }

      // ── Player bullets → enemies ─────────────────────────────────────
      G.bullets=G.bullets.filter(b=>{
        b.prevPos.copy(b.mesh.position);
        b.mesh.position.addScaledVector(b.dir,b.speed*dt);
        b.life-=dt;
        if(b.life<=0||collidesWall(b.mesh.position.x,b.mesh.position.z)){scene.remove(b.mesh);return false;}
        let hit=false;
        for(let i=0;i<G.enemies.length;i++){
          const e=G.enemies[i];
          if(!e.alive||hit) continue;
          V_TMP2.set(e.mesh.position.x,.7,e.mesh.position.z);
          V_TMP3.set(b.prevPos.x,.7,b.prevPos.z);
          V_TMP4.set(b.mesh.position.x,.7,b.mesh.position.z);
          if(sweptHit(V_TMP3,V_TMP4,V_TMP2,.68)){
            hit=true; e.hp-=b.dmg; e.hitFlash=12;
            e.knockback.copy(b.dir).multiplyScalar(.16);
            spawnImpact(e.mesh.position,0xff2200); G.sfx.hit();
            if(e.hp<=0&&e.deathTimer<0) killEnemy(e);
          }
        }
        // barrel hits
        for(let i=0;i<G.barrels.length;i++){
          const bar=G.barrels[i];
          if(!bar.alive||hit) continue;
          V_TMP3.set(b.prevPos.x,0,b.prevPos.z);
          V_TMP4.set(b.mesh.position.x,0,b.mesh.position.z);
          V_TMP2.set(bar.x,0,bar.z);
          if(sweptHit(V_TMP3,V_TMP4,V_TMP2,.38)){
            hit=true; bar.alive=false; scene.remove(bar.mesh);
            G.walls=G.walls.filter(w=>!(Math.abs(w.x-bar.x)<.15&&Math.abs(w.z-bar.z)<.15));
            spawnExplosion(bar.mesh.position.clone(),4.5,65);
          }
        }
        if(hit){scene.remove(b.mesh);return false;}
        return true;
      });

      // ── Grenades — Rigidbody-style physics ───────────────────────────
      G.grenades=G.grenades.filter(gr=>{
        if(gr.exploded) return false;
        gr.vel.y-=.012*dt;                // gravity
        gr.mesh.position.addScaledVector(gr.vel,dt);
        gr.mesh.rotation.x+=.12*dt;
        gr.life-=dt;
        // wall bounce
        if(collidesWall(gr.mesh.position.x,gr.mesh.position.z)){
          gr.vel.x*=-.55; gr.vel.z*=-.55; gr.bounces++;
        }
        if(gr.mesh.position.y<=.1){ gr.mesh.position.y=.1; gr.vel.y*=-.42; gr.vel.x*=.78; gr.vel.z*=.78; }
        if(gr.life<=0){
          gr.exploded=true; spawnExplosion(gr.mesh.position.clone(),5,72); scene.remove(gr.mesh); return false;
        }
        return true;
      });

      // ── Enemy AI — NavAgent style (seek/patrol + cover-aware LOS) ────
      G.enemies.forEach(e=>{
        // Death animation
        if(!e.alive){
          if(e.deathTimer>0){
            e.deathTimer-=dt; const prog=1-e.deathTimer/48;
            e.mesh.rotation.z+=(e.deathRotTarget-e.mesh.rotation.z)*.09*dt;
            e.mesh.position.y=Math.max(-.2,-prog*.32);
            for(let i=0;i<e.fadeMats.length;i++){
              const mat=e.fadeMats[i];
              mat.transparent=true;
              mat.opacity=Math.max(0,1-prog);
            }
          }
          return;
        }

        // Hit flash / drone mark
        if(e.droneMarked>0){
          e.droneMarked-=dt;
          for(let i=0;i<e.emissiveMats.length;i++) e.emissiveMats[i].emissive.setRGB(0,.28,0);
        }
        if(e.hitFlash>0){
          e.hitFlash-=dt; const t=e.hitFlash/12;
          for(let i=0;i<e.emissiveMats.length;i++) e.emissiveMats[i].emissive.setRGB(t*.9,0,0);
        } else if(e.droneMarked<=0){
          for(let i=0;i<e.emissiveMats.length;i++) e.emissiveMats[i].emissive.setRGB(0,0,0);
        }

        // Knockback
        if(e.knockback.length()>0.001){
          e.vel.x+=e.knockback.x; e.vel.z+=e.knockback.z; e.knockback.multiplyScalar(.6);
        }
        // Velocity decay
        e.vel.multiplyScalar(.72);

        const dist=P.mesh.position.distanceTo(e.mesh.position);
        const canSeePlayer=hasLOS(e.mesh.position,P.mesh.position);
        if(dist<15&&canSeePlayer) e.state="chase"; else if(dist>18||!canSeePlayer) e.state="patrol";

        // ── Patrol ───────────────────────────────────────────────────
        if(e.state==="patrol"){
          e.patrolTimer-=dt;
          if(e.patrolTimer<=0){ e.patrolDir.set((Math.random()-.5),0,(Math.random()-.5)).normalize(); e.patrolTimer=55+Math.random()*60; }
          const px=e.mesh.position.x+e.patrolDir.x*e.cfg.spd*.65*dt;
          const pz=e.mesh.position.z+e.patrolDir.z*e.cfg.spd*.65*dt;
          if(!collidesWall(px,e.mesh.position.z)&&Math.abs(px)<22) e.mesh.position.x=px;
          else e.patrolDir.negate();
          if(!collidesWall(e.mesh.position.x,pz)&&Math.abs(pz)<22) e.mesh.position.z=pz;
          e.mesh.rotation.y=Math.atan2(e.patrolDir.x,e.patrolDir.z);
        }

        // ── Chase — NavAgent-style movement toward preferred distance ─
        else {
          const toDir=V_TMP5.subVectors(P.mesh.position,e.mesh.position).normalize();

          // Strafe at preferred distance
          e.strafeTimer-=dt;
          if(e.strafeTimer<=0){ e.strafeDir*=-1; e.strafeTimer=30+Math.random()*40; }
          const strafeVec=V_TMP6.set(-toDir.z,0,toDir.x).multiplyScalar(e.strafeDir);

          let mx=0,mz=0;
          if(dist>e.cfg.prefDist+1.5){
            mx+=toDir.x*e.cfg.spd; mz+=toDir.z*e.cfg.spd;    // approach
          } else if(dist<e.cfg.prefDist-.5){
            mx-=toDir.x*e.cfg.spd*.6; mz-=toDir.z*e.cfg.spd*.6; // back off
          }
          // Strafe component
          mx+=strafeVec.x*e.cfg.spd*.5; mz+=strafeVec.z*e.cfg.spd*.5;

          const nx=e.mesh.position.x+(mx+e.vel.x)*dt, nz=e.mesh.position.z+(mz+e.vel.z)*dt;
          if(!collidesWall(nx,e.mesh.position.z)&&Math.abs(nx)<22) e.mesh.position.x=nx;
          if(!collidesWall(e.mesh.position.x,nz)&&Math.abs(nz)<22) e.mesh.position.z=nz;
          e.mesh.rotation.y=Math.atan2(toDir.x,toDir.z);

          // ── Shooting (only if LOS to player) ─────────────────────
          e.shootTimer-=dt;
          if(e.shootTimer<=0&&dist<e.cfg.range&&canSeePlayer){
            if(e.type==="shotgunner"){
              for(let i=0;i<4;i++){
                const spread=new THREE.Vector3((Math.random()-.5)*.45,0,(Math.random()-.5)*.45);
                const bm2=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.36,4),new THREE.MeshBasicMaterial({color:0xff7744}));
                bm2.rotation.x=Math.PI/2;
                const bp=e.mesh.position.clone().add(new THREE.Vector3(0,.72,0));
                bm2.position.copy(bp); scene.add(bm2);
                G.eBullets.push({mesh:bm2,prevPos:bp.clone(),dir:toDir.clone().add(spread).normalize(),speed:.3,life:55,dmg:e.cfg.dmg*.35});
              }
              G.sfx.shotgun();
            } else {
              const bm3=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.42,4),new THREE.MeshBasicMaterial({color:e.type==="sniper"?0xff2233:0xff5555}));
              bm3.rotation.x=Math.PI/2;
              const bp3=e.mesh.position.clone().add(new THREE.Vector3(0,.72,0));
              bm3.position.copy(bp3); scene.add(bm3);
              G.eBullets.push({mesh:bm3,prevPos:bp3.clone(),dir:toDir.clone().normalize(),speed:e.type==="sniper"?.58:.38,life:90,dmg:e.cfg.dmg});
              if(e.type==="sniper") G.sfx.sniper(); else G.sfx.shot();
            }
            e.shootTimer=e.cfg.shootInt+Math.random()*30;
            const muzzle=e.muzzle;
            if(muzzle){muzzle.material.opacity=1;later(()=>{if(muzzle)muzzle.material.opacity=0;},58);}
            // Sniper laser
            const lz=e.laser;
            if(lz){lz.material.opacity=.65;later(()=>{if(lz)lz.material.opacity=0;},850);}
          }

          // Grenadier throw
          if(e.type==="grenadier"&&e.shootTimer<=0&&dist<11&&canSeePlayer){
            const gm=new THREE.Mesh(new THREE.SphereGeometry(.1,6,6),new THREE.MeshLambertMaterial({color:0x556633}));
            gm.position.copy(e.mesh.position).add(new THREE.Vector3(0,.8,0)); scene.add(gm);
            const gvel=toDir.clone().multiplyScalar(.22); gvel.y=.18;
            G.grenades.push({mesh:gm,vel:gvel,life:55,bounces:0,exploded:false});
            G.sfx.grenade();
            e.shootTimer=e.cfg.shootInt;
          }
        }

        e.mesh.position.y=e.state==="chase"?Math.abs(Math.sin(ts*.007))*.04:0;
      });

      // ── Enemy bullets → player ───────────────────────────────────────
      G.eBullets=G.eBullets.filter(b=>{
        b.prevPos.copy(b.mesh.position);
        b.mesh.position.addScaledVector(b.dir,b.speed*dt);
        b.life-=dt;
        if(b.life<=0||collidesWall(b.mesh.position.x,b.mesh.position.z)){scene.remove(b.mesh);return false;}
        V_TMP2.set(P.mesh.position.x,.7,P.mesh.position.z);
        V_TMP3.set(b.prevPos.x,.7,b.prevPos.z);
        V_TMP4.set(b.mesh.position.x,.7,b.mesh.position.z);
        if(P.iFrames<=0&&sweptHit(V_TMP3,V_TMP4,V_TMP2,.72)){
          damagePlayer(b.dmg,b.mesh.position); scene.remove(b.mesh); return false;
        }
        return true;
      });

      // ── Particles ────────────────────────────────────────────────────
      G.particles=G.particles.filter(p=>{
        p.mesh.position.addScaledVector(p.vel,dt);
        p.vel.y-=.007*dt; p.life-=dt;
        if(p.mesh.material) p.mesh.material.opacity=Math.max(0,p.life/p.maxLife);
        if(p.life<=0){scene.remove(p.mesh);return false;} return true;
      });
    }

    requestAnimationFrame(animate);

    // ── Restart ────────────────────────────────────────────────────────────
    G.restart=()=>{
      G.gameState="playing"; G.wave=0;
      [G.bullets,G.eBullets,G.particles,G.grenades].forEach(a=>{a.forEach(x=>scene.remove(x.mesh));a.length=0;});
      const P=G.player;
      Object.assign(P,{hp:100,armor:50,ammo:30,grenades:3,reloading:false,reloadTimer:0,shootTimer:0,alive:true,iFrames:0,stumbleTimer:0,dodging:false,dodgeTimer:0,airstrikeTimer:0,droneTimer:0});
      P.vel.set(0,0,0); P.knockback.set(0,0,0); P.facing=0;
      P.mesh.position.set(0,0,0); P.mesh.rotation.set(0,0,0);
      G.barrels.forEach(b=>{if(!b.alive){b.alive=true;scene.add(b.mesh);}});
      const cnt=spawnEnemies(0); const wc=WAVES[0];
      setUi({hp:100,armor:50,ammo:30,grenades:3,score:0,enemies:cnt,wave:0,state:"playing",flash:false,reloading:false,dodging:false,airstrikeReady:true,droneReady:true,combo:0,kills:0,waveLabel:wc.label,obj:wc.obj});
    };
  
}
