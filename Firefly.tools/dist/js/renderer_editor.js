"use strict";
/* ================= state ================= */
const TILE = 32;
const gameFiles = new Map();      // basename -> File
const irFiles   = new Map();      // name(lower) -> File
const texCache  = new Map();      // texname -> {status,canvas,w,h}
let gtpImg=null, gtpBox=null, gtpModular=null; // gtpModular for growtopian2.png parts

let doc=null, hadDecl=true, rendererName="renderer";
let sprites={}, animMap={}, layers=[], selected=-1;
let pickerSprite=null;            // sprite name shown in frame picker

let zoom=9, panX=0, panY=0, inited=false;
let animate=false, showGrid=true, showGtp=true, obeyState=true, dimOthers=false;
let action="IDLE", facing="right";
let suppressXMLWrite=false;       // don't overwrite textarea while user types
let xmlTimer=null;

/* ================= dom ================= */
const $ = id => document.getElementById(id);
const cv = $("cv"), ctx = cv.getContext("2d");

/* ================= constants ================= */
const ALIGN = {
  CENTER:[.5,.5], UP_CENTER:[.5,0], UPPER_CENTER:[.5,0], TOP_CENTER:[.5,0],
  DOWN_CENTER:[.5,1], BOTTOM_CENTER:[.5,1], LEFT_CENTER:[0,.5], RIGHT_CENTER:[1,.5],
  UP_LEFT:[0,0], UPPER_LEFT:[0,0], UP_RIGHT:[1,0], UPPER_RIGHT:[1,0], DOWN_LEFT:[0,1], DOWN_RIGHT:[1,1]
};
const ALIGN_NAMES=["","CENTER","DOWN_CENTER","UP_CENTER","UPPER_CENTER","LEFT_CENTER","RIGHT_CENTER","DOWN_LEFT","DOWN_RIGHT","UP_LEFT","UP_RIGHT"];
const BLENDS=["","PREMULTIPLIED_ALPHA","ADDITIVE","NORMAL"];
const Z={ RenderBehind:-20, RenderBackpack:-10, RenderChestBackItem:-8, RenderBackArm:-6, RenderBackHandItem:-5,
  RenderShoes:1, RenderPants:2, RenderShirt:3, RenderChestItem:4, RenderChestBackItem2:4, RenderHair:5,
  RenderFaceItem:6, RenderHandItem:7, RenderFrontArm:8, RenderFrontpack:8, RenderInFront:10, RenderTransform:11, RenderPet:12 };
const RULE_NAMES=["RenderBehind","RenderBackpack","RenderChestBackItem","RenderBackArm","RenderBackHandItem",
  "RenderShoes","RenderPants","RenderShirt","RenderChestItem","RenderHair","RenderFaceItem","RenderHandItem",
  "RenderFrontArm","RenderFrontpack","RenderInFront","RenderTransform","RenderPet"];
const zFor=r=>(r in Z)?Z[r]:9;

/* ================= helpers ================= */
const baseName=p=>String(p||"").split(/[\\/]/).pop().toLowerCase();
const num=(v,d)=>{const n=parseFloat(v);return isFinite(n)?n:d;};
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function pair(str,dx,dy){ if(str==null||str==="") return [dx,dy]; const p=String(str).split(","); return [num(p[0],dx), num(p.length>1?p[1]:p[0],dy)]; }
function parseSize(s){ if(!s) return [TILE,TILE]; const p=String(s).replace(/x/gi,",").split(","); const w=num(p[0],TILE),h=num(p.length>1?p[1]:p[0],w); return [w,h]; }

const ACT_TOKENS={ IDLE:["idle"], WALK:["move","walk"], JUMP:["jump"], FALL:["fall"], PUNCH:["punch"], DANCE:["dance"] };
const KNOWN=new Set(["idle","move","walk","jump","fall","punch","dance","left","right","none","equip"]);
const curTokens=()=>[...(ACT_TOKENS[action]||[]),facing];
function stateMatches(layer){
  if(!obeyState) return true;
  const el=layer.el;
  const oa=(el.getAttribute("onAction")||"").toUpperCase();
  if(oa){ const list=oa.split("|").map(s=>s.trim()); const me=action==="WALK"?["WALK","MOVE"]:[action];
    if(!list.some(x=>me.includes(x))) return false; }
  const os=el.getAttribute("onState")||"";
  if(os){ const clauses=os.split("|").map(c=>c.split(".").pop().toLowerCase().trim());
    const known=clauses.filter(c=>KNOWN.has(c)); const tok=curTokens();
    if(known.length && !known.some(c=>tok.includes(c))) return false; }
  return true;
}

/* ================= RTTEX decode ================= */
const rdNum=(b,p,l)=>{let v=0;for(let a=0;a<l;a++)v+=b[p+a]<<(a*8);return v>>>0;};
const rdStr=(b,p,l)=>{let s="";for(let a=0;a<l;a++)s+=String.fromCharCode(b[p+a]);return s;};
function decodeRTTEX(u8){
  if(rdStr(u8,0,6)==="RTPACK"){ if(!window.pako) throw new Error("pako missing"); u8=pako.inflate(u8.slice(32)); }
  if(rdStr(u8,0,6)!=="RTTXTR") return null;
  const h=rdNum(u8,8,4), w=rdNum(u8,12,2), usesAlpha=u8[0x1c], ch=3+(usesAlpha?1:0);
  const start=0x7c, count=w*h, raw=new Uint8ClampedArray(w*h*4);
  for(let i=0;i<count;i++){ const s=start+i*ch, d=i*4;
    raw[d]=u8[s]; raw[d+1]=u8[s+1]; raw[d+2]=u8[s+2]; raw[d+3]=ch===4?u8[s+3]:255; }
  const tmp=document.createElement("canvas"); tmp.width=w; tmp.height=h;
  tmp.getContext("2d").putImageData(new ImageData(raw,w,h),0,0);
  const out=document.createElement("canvas"); out.width=w; out.height=h;
  const o=out.getContext("2d"); o.translate(0,h); o.scale(1,-1); o.drawImage(tmp,0,0);
  return {canvas:out,w,h};
}
function getTexture(fileName){
  const key=baseName(fileName); if(!key) return null;
  const c=texCache.get(key);
  if(c) return c.status==="ready"?c.canvas:null;
  texCache.set(key,{status:"loading"}); loadTexture(fileName,key); return null;
}
async function loadTexture(fileName,key){
  try{
    let buf=null; const f=gameFiles.get(key);
    if(f) buf=new Uint8Array(await f.arrayBuffer());
    else { try{ const r=await fetch("game/"+key); if(r.ok) buf=new Uint8Array(await r.arrayBuffer()); }catch(_){} }
    if(!buf) texCache.set(key,{status:"error"});
    else { const d=decodeRTTEX(buf); texCache.set(key, d?{status:"ready",canvas:d.canvas,w:d.w,h:d.h}:{status:"error"}); }
  }catch(e){ console.warn("decode fail",key,e); texCache.set(key,{status:"error"}); }
  updateBadges();
  if(pickerSprite && sprites[pickerSprite] && baseName(sprites[pickerSprite].file)===key) drawFramePicker();
  scheduleRender();
}

/* ================= load / parse ================= */
function loadXMLString(text,name,fromTextarea){
  if(name){ rendererName=name.replace(/\.xml$/i,""); }
  hadDecl=/<\?xml[\s\S]*?\?>/i.test(text);
  const clean=text.replace(/<\?xml[\s\S]*?\?>/i,"");
  const p=new DOMParser().parseFromString(clean,"application/xml");
  const err=p.querySelector("parsererror");
  if(err){ $("xmlMsg").innerHTML='<span class="err">parse error: '+esc(err.textContent.slice(0,140))+'</span>'; if(!fromTextarea) setStatus("XML parse error","err"); return false; }
  if(!p.querySelector("ItemRenderer")){ $("xmlMsg").innerHTML='<span class="warn">no &lt;ItemRenderer&gt; root found</span>'; }
  else $("xmlMsg").innerHTML='<span class="good">parsed ok</span>';
  doc=p; selected=-1; pickerSprite=null;
  parseSprites(); parseAnims(); buildLayers();
  if(!inited) recenter();
  renderEditor(); renderSpriteEditor();
  if(!fromTextarea) refreshXML();
  scheduleRender();
  if(!fromTextarea) setStatus("Loaded "+rendererName+".xml","good");
  return true;
}
function parseSprites(){
  sprites={};
  doc.querySelectorAll("Sprite").forEach(s=>{
    const nm=s.getAttribute("name"); if(!nm) return;
    const [w,h]=parseSize(s.getAttribute("textureSize"));
    const [c,r]=pair(s.getAttribute("frame"),0,0);
    sprites[nm]={ el:s, file:s.getAttribute("fileName")||s.getAttribute("filename")||"", tileW:w,tileH:h,col:c,row:r };
  });
}
function parseAnims(){
  animMap={};
  doc.querySelectorAll("SpriteAnimation").forEach(a=>{
    const nm=a.getAttribute("sprite"); if(!nm) return;
    const frames=[]; a.querySelectorAll(":scope > Frame").forEach(f=>{ const [c,r]=pair(f.textContent.trim(),0,0); frames.push([c,r]); });
    if(!frames.length) return;
    (animMap[nm]=animMap[nm]||[]).push({ frames, animTime:num(a.getAttribute("animTime"),500),
      playOnAction:(a.getAttribute("playOnAction")||"").toUpperCase(), playOnState:(a.getAttribute("playOnState")||""), autoPlay:a.getAttribute("autoPlay")==="true" });
  });
}
function ruleNameOf(el){ let n=el; while(n.parentElement && n.parentElement.tagName!=="RenderRules") n=n.parentElement; return n.parentElement?n.tagName:(el.parentElement?el.parentElement.tagName:"?"); }
function buildLayers(){
  layers=[]; if(!doc){ updateBadges(); return; }
  const rr=doc.querySelector("RenderRules"); if(!rr){ updateBadges(); return; }
  let idx=0;
  rr.querySelectorAll("SpriteRender").forEach(el=>{
    if(el._hidden===undefined) el._hidden=false;
    const rl=ruleNameOf(el);
    layers.push({ el, name:el.getAttribute("name"), ruleName:rl, z:zFor(rl), idx:idx++ });
  });
  layers.sort((a,b)=>a.z-b.z||a.idx-b.idx);
  updateBadges();
}

/* ================= geometry ================= */
function alignOf(layer){
  const el=layer.el; let nm=el.getAttribute("alignment");
  if(facing==="left"  && el.getAttribute("alignmentLeft"))  nm=el.getAttribute("alignmentLeft");
  if(facing==="right" && el.getAttribute("alignmentRight")) nm=el.getAttribute("alignmentRight");
  return ALIGN[(nm||"CENTER").toUpperCase()]||[.5,.5];
}
function pickAnim(name){
  const list=animMap[name]; if(!list||!list.length) return null;
  let m=list.find(a=>a.playOnAction.includes(action)||a.playOnState.toUpperCase().includes(action));
  if(!m) m=list.find(a=>a.autoPlay); return m||list[0];
}
function frameOf(layer){
  const sp=sprites[layer.name]; if(!sp) return null;
  let col=sp.col,row=sp.row;
  if(animate){ const an=pickAnim(layer.name); if(an){ const per=Math.max(1,an.animTime/an.frames.length); const i=Math.floor(performance.now()/per)%an.frames.length; col=an.frames[i][0]; row=an.frames[i][1]; } }
  return {col,row,tileW:sp.tileW,tileH:sp.tileH,file:sp.file};
}
function rectOf(layer){
  const sp=sprites[layer.name]; if(!sp) return null;
  const fr=frameOf(layer);
  const off=pair(layer.el.getAttribute("offset"),0,0);
  const sc=pair(layer.el.getAttribute("scale"),1,1);
  const [ax,ay]=alignOf(layer);
  const dw=fr.tileW*sc[0], dh=fr.tileH*sc[1];
  // GROWTOPIA OFFSET SYSTEM (Real Client Architecture):
  // Origin (0,0) = player's feet (ground level, bottom-center)
  // Player anatomy: 20×34px logical bounds
  //   - Head: 12×12px at Y=-34 to Y=-22 (top of player)
  //   - Torso: 10×14px at Y=-22 to Y=-8 (master structural anchor)
  //   - Legs: Y=-8 to Y=0 (feet at ground)
  // Offset is in PIXELS from feet position
  // Negative Y = UP (toward head), Positive Y = DOWN (below feet)
  // Alignment determines which point of the SPRITE attaches to (anchor + offset)
  const attachX=off[0], attachY=off[1];
  return { left:attachX-ax*dw, top:attachY-ay*dh, w:dw, h:dh, fr,
           flip:pair(layer.el.getAttribute("flip"),0,0), blend:(layer.el.getAttribute("blend")||"").toUpperCase() };
}

/* ================= view ================= */
const w2sx=x=>panX+x*zoom, w2sy=y=>panY+y*zoom, s2wx=x=>(x-panX)/zoom, s2wy=y=>(y-panY)/zoom;
const dpr=()=>window.devicePixelRatio||1;
function fitCanvas(){ const r=cv.getBoundingClientRect(),d=dpr(); const w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d)); if(cv.width!==w)cv.width=w; if(cv.height!==h)cv.height=h; }
function recenter(){ fitCanvas(); const r=cv.getBoundingClientRect(); panX=(r.width||800)/2; panY=(r.height||500)/2; inited=true; scheduleRender(); }

/* ================= render ================= */
let rafPending=false;
function scheduleRender(){ if(rafPending) return; rafPending=true; requestAnimationFrame(()=>{ rafPending=false; try{ render(); }catch(e){ console.error("render error",e);} if(animate) scheduleRender(); }); }
function render(){
  fitCanvas();
  ctx.setTransform(dpr(),0,0,dpr(),0,0);
  const W=cv.getBoundingClientRect().width, H=cv.getBoundingClientRect().height;
  ctx.clearRect(0,0,W,H); ctx.imageSmoothingEnabled=false;
  if(showGrid) drawGrid(W,H);
  for(const l of layers) if(l.z<0) safeDrawLayer(l);
  if(showGtp) drawGtp();
  for(const l of layers) if(l.z>=0) safeDrawLayer(l);
  drawAxes(W,H);
  if(selected>=0 && layers[selected]) try{ drawSelection(layers[selected]); }catch(_){}
}
function drawGrid(W,H){
  const x0=Math.floor(s2wx(0)/TILE)*TILE, y0=Math.floor(s2wy(0)/TILE)*TILE;
  ctx.lineWidth=1; ctx.strokeStyle="#272b34"; ctx.beginPath();
  for(let x=x0;x<=s2wx(W);x+=TILE){ ctx.moveTo(w2sx(x),0); ctx.lineTo(w2sx(x),H); }
  for(let y=y0;y<=s2wy(H);y+=TILE){ ctx.moveTo(0,w2sy(y)); ctx.lineTo(W,w2sy(y)); }
  ctx.stroke();
}
function drawAxes(W,H){
  ctx.lineWidth=1; ctx.strokeStyle="#3c4150"; ctx.beginPath();
  ctx.moveTo(w2sx(0),0); ctx.lineTo(w2sx(0),H); ctx.moveTo(0,w2sy(0)); ctx.lineTo(W,w2sy(0)); ctx.stroke();
  // Draw Growtopia player reference box: 20×34px logical bounds, anchored at feet (0,0)
  const PW=20, PH=34; // Real Growtopia player dimensions
  ctx.strokeStyle="#46506a"; ctx.setLineDash([3,3]);
  ctx.strokeRect(w2sx(-PW/2),w2sy(-PH),PW*zoom,PH*zoom); ctx.setLineDash([]);
  // Mark anatomical reference points
  ctx.strokeStyle="#5a6a8a"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(w2sx(-PW/2),w2sy(0)); ctx.lineTo(w2sx(PW/2),w2sy(0)); ctx.stroke(); // Ground (feet)
  ctx.strokeStyle="#6a7a9a"; ctx.lineWidth=1; ctx.setLineDash([2,2]);
  ctx.beginPath(); ctx.moveTo(w2sx(-PW/2),w2sy(-22)); ctx.lineTo(w2sx(PW/2),w2sy(-22)); ctx.stroke(); // Head base
  ctx.beginPath(); ctx.moveTo(w2sx(-PW/2),w2sy(-8)); ctx.lineTo(w2sx(PW/2),w2sy(-8)); ctx.stroke(); // Torso base
  ctx.setLineDash([]);
}
function drawGtp(){
  // Check if we have modular growtopian2.png (5 parts: left hand, head, foot, body, right hand)
  if(gtpModular){
    // MODULAR GROWTOPIAN ASSEMBLY (growtopian2.png)
    // Each part is 32×32, all at Y=0 in sprite sheet
    // X positions: 0=left hand, 1=head, 2=foot, 3=body, 4=right hand
    // "DOWN_CENTER" + "everything is on y 0" means all parts share the same baseline
    // They should be drawn side-by-side at the same Y level, forming the character
    const T=32; // tile size
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    
    // All parts at same Y level (feet at ground = Y=0)
    // DOWN_CENTER means bottom of each 32×32 sprite aligns at Y=0
    const baseY = -T; // sprites extend from Y=-32 to Y=0
    
    // Left hand (x=0): left side
    ctx.drawImage(gtpModular, 0*T,0,T,T, w2sx(-T*1.5), w2sy(baseY), T*zoom, T*zoom);
    
    // Head (x=1): center, represents the whole upper body
    ctx.drawImage(gtpModular, 1*T,0,T,T, w2sx(-T/2), w2sy(baseY), T*zoom, T*zoom);
    
    // Foot (x=2): center, at ground
    ctx.drawImage(gtpModular, 2*T,0,T,T, w2sx(-T/2), w2sy(baseY), T*zoom, T*zoom);
    
    // Body (x=3): center torso
    ctx.drawImage(gtpModular, 3*T,0,T,T, w2sx(-T/2), w2sy(baseY), T*zoom, T*zoom);
    
    // Right hand (x=4): right side
    ctx.drawImage(gtpModular, 4*T,0,T,T, w2sx(T/2), w2sy(baseY), T*zoom, T*zoom);
    
    ctx.restore();
    return;
  }
  
  // Fallback to single growtopian.png
  if(!gtpImg||!gtpBox) return;
  // GROWTOPIA PLAYER ANATOMY:
  // Logical bounds: 20×34 pixels (collision box slightly smaller: ~20×30px)
  // Origin (0,0) = BOTTOM-CENTER of feet (where player stands on ground)
  // Head: 12×12px at top, Torso: 10×14px (master anchor), Legs: bottom
  // Total height: 34px from feet to top of head
  const PLAYER_HEIGHT = 34; // Growtopia actual player height in pixels
  const s = PLAYER_HEIGHT / gtpBox.h;
  const dw = gtpBox.w * s, dh = PLAYER_HEIGHT;
  // Draw player with feet at origin (0,0), extending upward to -34px
  ctx.drawImage(gtpImg, gtpBox.x,gtpBox.y,gtpBox.w,gtpBox.h, w2sx(-dw/2), w2sy(-dh), dw*zoom, dh*zoom);
}
function safeDrawLayer(l){ try{ drawLayer(l); }catch(e){ console.warn("layer draw fail",l.name,e); } }
function drawLayer(l){
  if(l.el._hidden) return;
  if(obeyState && !stateMatches(l)) return;
  const r=rectOf(l); if(!r) return;
  const dx=w2sx(r.left), dy=w2sy(r.top), dw=r.w*zoom, dh=r.h*zoom;
  const tex=sprites[l.name]?getTexture(sprites[l.name].file):null;
  ctx.save();
  if(dimOthers && selected>=0 && layers[selected]!==l) ctx.globalAlpha=0.22;
  ctx.globalCompositeOperation=(r.blend==="ADDITIVE")?"lighter":"source-over";
  if(r.flip[0]||r.flip[1]){ ctx.translate(dx+dw/2,dy+dh/2); ctx.scale(r.flip[0]?-1:1,r.flip[1]?-1:1); ctx.translate(-(dx+dw/2),-(dy+dh/2)); }
  if(tex){ ctx.drawImage(tex, r.fr.col*r.fr.tileW, r.fr.row*r.fr.tileH, r.fr.tileW, r.fr.tileH, dx,dy,dw,dh); }
  else{
    const st=sprites[l.name]?texCache.get(baseName(sprites[l.name].file)):null;
    ctx.fillStyle=(st&&st.status==="error")?"rgba(255,80,80,.18)":"rgba(255,0,255,.16)"; ctx.fillRect(dx,dy,dw,dh);
    ctx.strokeStyle="rgba(255,0,255,.5)"; ctx.strokeRect(dx,dy,dw,dh);
    ctx.fillStyle="#d9b3ff"; ctx.font="10px monospace"; ctx.fillText(l.name||"?",dx+2,dy+11);
  }
  ctx.restore();
}
function drawSelection(l){
  const r=rectOf(l); if(!r) return;
  const dx=w2sx(r.left),dy=w2sy(r.top),dw=r.w*zoom,dh=r.h*zoom;
  ctx.save(); ctx.strokeStyle="#4d9cff"; ctx.lineWidth=2; ctx.setLineDash([6,4]); ctx.strokeRect(dx,dy,dw,dh);
  ctx.setLineDash([]); ctx.fillStyle="#4d9cff"; ctx.font="11px monospace";
  const off=pair(l.el.getAttribute("offset"),0,0);
  ctx.fillText(`${l.name} · off ${off[0]},${off[1]} · ${Math.round(r.w)}×${Math.round(r.h)}px`,dx,dy-5);
  const [ax,ay]=alignOf(l); ctx.fillStyle="#ffb74d";
  ctx.beginPath(); ctx.arc(w2sx(r.left+ax*r.w), w2sy(r.top+ay*r.h),3,0,7); ctx.fill();
  ctx.restore();
}

/* ================= layer list ================= */
function renderLayerList(){
  const box=$("layers"); box.innerHTML="";
  layers.forEach((l,i)=>{
    const d=document.createElement("div");
    const dim=(obeyState && !stateMatches(l));
    d.className="lyr"+(i===selected?" active":"")+((l.el._hidden||dim)?" off":"");
    d.innerHTML=`<span class="eye" title="show/hide">${l.el._hidden?"🚫":"👁"}</span><span class="nm">${esc(l.name||"?")}</span><span class="rl">${l.ruleName}</span>`;
    d.querySelector(".eye").onclick=ev=>{ ev.stopPropagation(); l.el._hidden=!l.el._hidden; renderLayerList(); scheduleRender(); };
    d.onclick=()=>{ selected=i; renderEditor(); renderSpriteEditor(); renderLayerList(); scheduleRender(); };
    box.appendChild(d);
  });
}

/* ================= SpriteRender editor ================= */
function renderEditor(){
  const box=$("editor");
  if(selected<0||!layers[selected]){ box.innerHTML='<h3>SpriteRender</h3><div class="none">Select a layer or click a sprite on the canvas.</div>'; return; }
  const l=layers[selected], el=l.el, sp=sprites[l.name];
  const off=pair(el.getAttribute("offset"),0,0), sc=pair(el.getAttribute("scale"),1,1), fl=pair(el.getAttribute("flip"),0,0);
  const al=(el.getAttribute("alignment")||"").toUpperCase();
  const blend=(el.getAttribute("blend")||"").toUpperCase();
  const spNames=Object.keys(sprites).map(n=>`<option ${n===l.name?"selected":""}>${esc(n)}</option>`).join("");
  const ruleOpts=RULE_NAMES.map(n=>`<option ${n===l.ruleName?"selected":""}>${n}</option>`).join("");
  const alOpts=ALIGN_NAMES.map(n=>`<option value="${n}" ${n===al?"selected":""}>${n||"(default CENTER)"}</option>`).join("");
  const blOpts=BLENDS.map(n=>`<option value="${n}" ${n===blend?"selected":""}>${n||"(none)"}</option>`).join("");
  const tileNote = sp ? (sp.tileW>TILE?`<span class="warn">tile ${sp.tileW}×${sp.tileH} = ${(sp.tileW/TILE)}× a 32px tile → try scale ${(TILE/sp.tileW).toFixed(2)}</span>`:`tile ${sp.tileW}×${sp.tileH}`) : `<span class="warn">no &lt;Sprite&gt; named "${esc(l.name)}"</span>`;
  // generic attribute rows (exclude ones we expose as structured controls)
  const handled=new Set(["name","offset","scale","flip","alignment","blend","onaction","onstate"]);
  let attrRows="";
  for(const at of [...el.attributes]) if(!handled.has(at.name.toLowerCase()))
    attrRows+=`<tr><td class="k"><input data-ak="${esc(at.name)}" class="atK" value="${esc(at.name)}"></td><td><input data-ak="${esc(at.name)}" class="atV" value="${esc(at.value)}"></td><td class="x" data-del="${esc(at.name)}">✕</td></tr>`;
  box.innerHTML=`
    <h3>SpriteRender · <span style="color:var(--accent)">${esc(l.name||"?")}</span></h3>
    <div class="row">
      <div class="fld" style="flex:1"><span>sprite</span><select id="eSP">${spNames}</select></div>
      <div class="fld" style="flex:1"><span>render rule (z-order)</span><select id="eRULE">${ruleOpts}</select></div>
    </div>
    <div class="row">
      <div class="fld"><span>offset X</span><input type="number" id="eOX" step="1" value="${off[0]}"></div>
      <div class="fld"><span>offset Y</span><input type="number" id="eOY" step="1" value="${off[1]}"></div>
      <div class="fld"><span>scale X</span><input type="number" id="eSX" step="0.05" value="${sc[0]}"></div>
      <div class="fld"><span>scale Y</span><input type="number" id="eSY" step="0.05" value="${sc[1]}"></div>
    </div>
    <div class="row">
      <button id="btnFit" class="sm" title="scale so 1 sprite tile = 1 game tile">scale → 1 tile</button>
      <button id="btnResetOff" class="sm">reset offset</button>
      <label class="chk"><input type="checkbox" id="eFX" ${fl[0]?"checked":""}> flip X</label>
      <label class="chk"><input type="checkbox" id="eFY" ${fl[1]?"checked":""}> flip Y</label>
    </div>
    <div class="row">
      <div class="fld" style="flex:1"><span>alignment</span><select id="eAL">${alOpts}</select></div>
      <div class="fld" style="flex:1"><span>blend</span><select id="eBL">${blOpts}</select></div>
    </div>
    <div class="row"><div class="fld" style="flex:1"><span>onAction (e.g. JUMP|FALL)</span><input class="fill" type="text" id="eONA" value="${esc(el.getAttribute("onAction")||"")}"></div></div>
    <div class="row"><div class="fld" style="flex:1"><span>onState (e.g. playerState.Jump)</span><input class="fill" type="text" id="eONS" value="${esc(el.getAttribute("onState")||"")}"></div></div>
    <div class="row muted">${tileNote}</div>
    <details><summary>all attributes (${[...el.attributes].length})</summary>
      <div class="pad"><table class="attrs"><tbody id="atBody">${attrRows||'<tr><td colspan="3" class="muted">no extra attributes</td></tr>'}</tbody></table>
      <div class="row"><input id="atNewK" type="text" placeholder="attribute" style="flex:1"><input id="atNewV" type="text" placeholder="value" style="flex:1"><button id="atAdd" class="sm">add</button></div></div>
    </details>
    <div class="row">
      <button id="btnDup" class="sm">＋ duplicate (for a state)</button>
      <button id="btnDel" class="sm danger">🗑 delete</button>
    </div>
    <div class="row muted" style="font-size:11px">GROWTOPIA OFFSET: Origin (0,0) = player's feet. Player: 20×34px (Head: Y=-34 to -22, Torso: Y=-22 to -8, Legs: Y=-8 to 0). Negative Y = UP, Positive Y = DOWN. Per-frame offsets don't exist — offset lives on SpriteRender. To move a sprite only during one state, duplicate this layer and set its onAction/onState.</div>`;
  const v=id=>num($(id).value,0);
  const apply=()=>{
    setA(el,"offset",`${v("eOX")},${v("eOY")}`);
    const sx=v("eSX"),sy=v("eSY"); if(sx===1&&sy===1) el.removeAttribute("scale"); else setA(el,"scale",`${sx},${sy}`);
    const fx=$("eFX").checked?1:0, fy=$("eFY").checked?1:0; if(!fx&&!fy) el.removeAttribute("flip"); else setA(el,"flip",`${fx},${fy}`);
    const av=$("eAL").value; if(av) setA(el,"alignment",av); else el.removeAttribute("alignment");
    const bl=$("eBL").value; if(bl) setA(el,"blend",bl); else el.removeAttribute("blend");
    const oa=$("eONA").value.trim(); if(oa) setA(el,"onAction",oa); else el.removeAttribute("onAction");
    const os=$("eONS").value.trim(); if(os) setA(el,"onState",os); else el.removeAttribute("onState");
    refreshXML(); renderLayerList(); scheduleRender();
  };
  ["eOX","eOY","eSX","eSY","eONA","eONS"].forEach(id=>$(id).addEventListener("input",apply));
  ["eFX","eFY","eAL","eBL"].forEach(id=>$(id).addEventListener("change",apply));
  $("eSP").onchange=()=>{ setA(el,"name",$("eSP").value); l.name=$("eSP").value; refreshXML(); renderLayerList(); renderSpriteEditor(); scheduleRender(); };
  $("eRULE").onchange=()=>moveToRule(l,$("eRULE").value);
  $("btnFit").onclick=()=>{ if(!sp) return; $("eSX").value=+(TILE/sp.tileW).toFixed(4); $("eSY").value=+(TILE/sp.tileH).toFixed(4); apply(); };
  $("btnResetOff").onclick=()=>{ $("eOX").value=0; $("eOY").value=0; apply(); };
  $("btnDup").onclick=()=>dupLayer(l);
  $("btnDel").onclick=()=>delLayer(l);
  // attribute table
  box.querySelectorAll(".atV").forEach(inp=>inp.addEventListener("change",()=>{ setA(el,inp.dataset.ak,inp.value); refreshXML(); renderLayerList(); scheduleRender(); }));
  box.querySelectorAll(".atK").forEach(inp=>inp.addEventListener("change",()=>{ const oldK=inp.dataset.ak,newK=inp.value.trim(); if(!newK||newK===oldK) return; const val=el.getAttribute(oldK); el.removeAttribute(oldK); setA(el,newK,val); renderEditor(); refreshXML(); scheduleRender(); }));
  box.querySelectorAll("[data-del]").forEach(td=>td.onclick=()=>{ el.removeAttribute(td.dataset.del); renderEditor(); refreshXML(); renderLayerList(); scheduleRender(); });
  $("atAdd").onclick=()=>{ const k=$("atNewK").value.trim(); if(!k) return; setA(el,k,$("atNewV").value); renderEditor(); refreshXML(); scheduleRender(); };
}
const setA=(el,k,v)=>el.setAttribute(k,v);

/* ================= Sprite definition editor + frame picker ================= */
function renderSpriteEditor(){
  const box=$("spriteEditor");
  const name = (selected>=0 && layers[selected]) ? layers[selected].name : pickerSprite;
  if(!name || !sprites[name]){ pickerSprite=null; box.innerHTML='<h3>Sprite definition</h3><div class="none">Select a layer (its &lt;Sprite&gt; shows here).</div>'; return; }
  pickerSprite=name;
  const sp=sprites[name], el=sp.el;
  const texList=[...gameFiles.keys()].sort();
  const dl = texList.map(t=>`<option value="game/${t}">`).join("");
  const st=texCache.get(baseName(sp.file));
  const dim = st&&st.status==="ready" ? `${st.w}×${st.h}px → ${Math.floor(st.w/sp.tileW)}×${Math.floor(st.h/sp.tileH)} frames` : (st&&st.status==="error"?'<span class="err">texture not found / not RTTEX</span>':'<span class="muted">decoding…</span>');
  box.innerHTML=`
    <h3>Sprite · <span style="color:var(--accent)">${esc(name)}</span></h3>
    <div class="row"><div class="fld" style="flex:1"><span>name</span><input class="fill" id="spName" type="text" value="${esc(name)}"></div></div>
    <div class="row"><div class="fld" style="flex:1"><span>fileName (rttex)</span>
      <input class="fill" id="spFile" type="text" list="texList" value="${esc(sp.file)}"><datalist id="texList">${dl}</datalist></div></div>
    <div class="row">
      <div class="fld"><span>tile W</span><input type="number" id="spTW" value="${sp.tileW}"></div>
      <div class="fld"><span>tile H</span><input type="number" id="spTH" value="${sp.tileH}"></div>
      <div class="fld"><span>frame col</span><input type="number" id="spFC" value="${sp.col}"></div>
      <div class="fld"><span>frame row</span><input type="number" id="spFR" value="${sp.row}"></div>
    </div>
    <div class="row muted">${dim} <span class="tag">click sheet to pick frame</span></div>
    <canvas id="fpcv" height="200"></canvas>`;
  const reparseSprite=()=>{ const [w,h]=parseSize(el.getAttribute("textureSize")); sp.tileW=w; sp.tileH=h; const[c,r]=pair(el.getAttribute("frame"),0,0); sp.col=c; sp.row=r; sp.file=el.getAttribute("fileName")||el.getAttribute("filename")||""; };
  $("spFile").addEventListener("input",()=>{ if(el.hasAttribute("filename")&&!el.hasAttribute("fileName")) el.setAttribute("filename",$("spFile").value); else setA(el,"fileName",$("spFile").value); reparseSprite(); refreshXML(); drawFramePicker(); scheduleRender(); });
  const sizeChange=()=>{ const w=num($("spTW").value,32),h=num($("spTH").value,32); setA(el,"textureSize", w===h?`${w}`:`${w},${h}`); reparseSprite(); refreshXML(); drawFramePicker(); scheduleRender(); };
  $("spTW").addEventListener("input",sizeChange); $("spTH").addEventListener("input",sizeChange);
  const frChange=()=>{ const c=num($("spFC").value,0),r=num($("spFR").value,0); setA(el,"frame",`${c},${r}`); reparseSprite(); refreshXML(); drawFramePicker(); scheduleRender(); };
  $("spFC").addEventListener("input",frChange); $("spFR").addEventListener("input",frChange);
  $("spName").addEventListener("change",()=>renameSprite(name,$("spName").value.trim()));
  drawFramePicker();
}
function drawFramePicker(){
  const c=$("fpcv"); if(!c||!pickerSprite||!sprites[pickerSprite]) return;
  const sp=sprites[pickerSprite]; const tex=getTexture(sp.file);
  const cw=c.clientWidth||320; const x=c.getContext("2d");
  if(!tex){ c.width=cw; c.height=80; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,c.width,c.height); x.fillStyle="#8b93a3"; x.font="12px sans-serif"; x.fillText("texture not loaded — load game/ folder",8,44); return; }
  const sc=Math.max(0.05, Math.min(cw/tex.width, 8));
  c.width=cw; c.height=Math.max(60, Math.round(tex.height*sc));
  x.setTransform(1,0,0,1,0,0); x.imageSmoothingEnabled=false;
  x.clearRect(0,0,c.width,c.height);
  x.drawImage(tex,0,0,tex.width*sc,tex.height*sc);
  // grid
  x.strokeStyle="rgba(120,140,180,.35)"; x.lineWidth=1; x.beginPath();
  for(let gx=0; gx<=tex.width; gx+=sp.tileW){ x.moveTo(gx*sc,0); x.lineTo(gx*sc,tex.height*sc); }
  for(let gy=0; gy<=tex.height; gy+=sp.tileH){ x.moveTo(0,gy*sc); x.lineTo(tex.width*sc,gy*sc); }
  x.stroke();
  // highlight current frame
  x.strokeStyle="#ffb74d"; x.lineWidth=2;
  x.strokeRect(sp.col*sp.tileW*sc, sp.row*sp.tileH*sc, sp.tileW*sc, sp.tileH*sc);
  c.onclick=ev=>{
    const r=c.getBoundingClientRect();
    const px=(ev.clientX-r.left)*(c.width/r.width), py=(ev.clientY-r.top)*(c.height/r.height);
    const col=Math.floor(px/(sp.tileW*sc)), row=Math.floor(py/(sp.tileH*sc));
    setA(sp.el,"frame",`${col},${row}`); sp.col=col; sp.row=row;
    if($("spFC")) $("spFC").value=col; if($("spFR")) $("spFR").value=row;
    refreshXML(); drawFramePicker(); scheduleRender();
  };
}
function renameSprite(oldN,newN){
  if(!newN||newN===oldN||!sprites[oldN]) return;
  if(sprites[newN]){ setStatus("a sprite named "+newN+" already exists","warn"); return; }
  setA(sprites[oldN].el,"name",newN);
  sprites[newN]=sprites[oldN]; delete sprites[oldN];
  doc.querySelectorAll("SpriteRender").forEach(sr=>{ if(sr.getAttribute("name")===oldN) sr.setAttribute("name",newN); });
  buildLayers(); if(selected>=0&&layers[selected]) layers[selected].name=newN; pickerSprite=newN;
  renderEditor(); renderSpriteEditor(); refreshXML(); renderLayerList(); scheduleRender();
}

/* ================= structural edits ================= */
function ensureRule(name){
  let rr=doc.querySelector("RenderRules"); if(!rr){ rr=doc.createElement("RenderRules"); doc.documentElement.appendChild(rr); }
  let g=[...rr.children].find(c=>c.tagName===name); if(!g){ g=doc.createElement(name); rr.appendChild(g); } return g;
}
function moveToRule(layer,ruleName){ ensureRule(ruleName).appendChild(layer.el); buildLayers(); selected=layers.findIndex(x=>x.el===layer.el); renderEditor(); renderLayerList(); refreshXML(); scheduleRender(); }
function dupLayer(layer){ const clone=layer.el.cloneNode(true); clone._hidden=false; layer.el.parentNode.insertBefore(clone,layer.el.nextSibling); buildLayers(); selected=layers.findIndex(x=>x.el===clone); renderEditor(); renderLayerList(); refreshXML(); scheduleRender(); setStatus("Duplicated — set its onAction/onState for a per-state offset","good"); }
function delLayer(layer){ layer.el.remove(); buildLayers(); selected=-1; renderEditor(); renderSpriteEditor(); renderLayerList(); refreshXML(); scheduleRender(); }
function addLayer(){ if(!doc){ setStatus("Load an XML first","warn"); return; } const g=ensureRule("RenderInFront"); const el=doc.createElement("SpriteRender"); el.setAttribute("name",Object.keys(sprites)[0]||""); el.setAttribute("offset","0,0"); g.appendChild(el); buildLayers(); selected=layers.findIndex(x=>x.el===el); renderEditor(); renderSpriteEditor(); renderLayerList(); refreshXML(); scheduleRender(); }

/* ================= output ================= */
function serialize(){ if(!doc) return ""; let s=new XMLSerializer().serializeToString(doc.documentElement); if(hadDecl) s='<?xml version="1.0" encoding="utf-8"?>\n'+s; return s; }
function refreshXML(){ if(suppressXMLWrite) return; $("xml").value=serialize(); }
function prettyXML(src){
  // light pretty-printer for the serialized one-liner
  let xml=src.replace(/<\?xml[\s\S]*?\?>\s*/,"");
  xml=xml.replace(/>\s*</g,">\n<");
  let pad=0,out=[];
  xml.split("\n").forEach(line=>{
    line=line.trim(); if(!line) return;
    if(/^<\//.test(line)) pad=Math.max(0,pad-1);
    out.push("  ".repeat(pad)+line);
    if(/^<[^!?][^>]*[^\/]>$/.test(line) && !/^<.*<\/.*>$/.test(line)) pad++;
  });
  let body=out.join("\n");
  if(hadDecl) body='<?xml version="1.0" encoding="utf-8"?>\n'+body;
  return body;
}
function updateBadges(){ let ready=0; texCache.forEach(v=>{ if(v.status==="ready") ready++; }); $("texStatus").textContent=`textures ${ready}/${texCache.size}`; $("layerCount").textContent=`layers ${layers.length}`; }
function setStatus(t,cls){ const s=$("status"); s.textContent=t; s.className=cls||"muted"; }

/* ================= pointer ================= */
let drag=null, panning=null;
cv.addEventListener("mousedown",e=>{
  const rect=cv.getBoundingClientRect(), mx=e.clientX-rect.left, my=e.clientY-rect.top;
  if(e.button===1||e.button===2){ panning={mx,my,px:panX,py:panY}; e.preventDefault(); return; }
  const wx=s2wx(mx), wy=s2wy(my);
  for(let i=layers.length-1;i>=0;i--){
    const l=layers[i]; if(l.el._hidden||(obeyState&&!stateMatches(l))) continue;
    const r=rectOf(l); if(!r) continue;
    if(wx>=r.left&&wx<=r.left+r.w&&wy>=r.top&&wy<=r.top+r.h){
      selected=i; renderEditor(); renderSpriteEditor(); renderLayerList();
      drag={layer:l, startOff:pair(l.el.getAttribute("offset"),0,0), startWX:wx, startWY:wy}; scheduleRender(); return;
    }
  }
  selected=-1; renderEditor(); renderSpriteEditor(); renderLayerList(); scheduleRender();
});
window.addEventListener("mousemove",e=>{
  const rect=cv.getBoundingClientRect(), mx=e.clientX-rect.left, my=e.clientY-rect.top;
  $("coord").textContent=`${Math.round(s2wx(mx))}, ${Math.round(s2wy(my))}`;
  if(panning){ panX=panning.px+(mx-panning.mx); panY=panning.py+(my-panning.my); scheduleRender(); return; }
  if(drag){
    const dx=s2wx(mx)-drag.startWX, dy=s2wy(my)-drag.startWY, step=e.shiftKey?0.25:1;
    const nx=Math.round((drag.startOff[0]+dx)/step)*step, ny=Math.round((drag.startOff[1]+dy)/step)*step;
    setA(drag.layer.el,"offset",`${nx},${ny}`);
    if(selected>=0&&layers[selected]===drag.layer){ if($("eOX")) $("eOX").value=nx; if($("eOY")) $("eOY").value=ny; }
    refreshXML(); scheduleRender();
  }
});
window.addEventListener("mouseup",()=>{ drag=null; panning=null; });
cv.addEventListener("contextmenu",e=>e.preventDefault());
cv.addEventListener("wheel",e=>{ e.preventDefault(); const rect=cv.getBoundingClientRect(), mx=e.clientX-rect.left, my=e.clientY-rect.top; const wx=s2wx(mx), wy=s2wy(my), f=e.deltaY<0?1.15:1/1.15; zoom=Math.max(2,Math.min(40,zoom*f)); panX=mx-wx*zoom; panY=my-wy*zoom; $("zoom").value=Math.round(zoom); scheduleRender(); },{passive:false});
window.addEventListener("keydown",e=>{
  if(selected<0||!layers[selected]) return;
  const t=e.target.tagName; if(t==="INPUT"||t==="SELECT"||t==="TEXTAREA") return;
  const map={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}; if(!map[e.key]) return; e.preventDefault();
  const step=e.shiftKey?5:(e.altKey?0.25:1); const off=pair(layers[selected].el.getAttribute("offset"),0,0);
  const nx=off[0]+map[e.key][0]*step, ny=off[1]+map[e.key][1]*step;
  setA(layers[selected].el,"offset",`${nx},${ny}`); if($("eOX")) $("eOX").value=nx; if($("eOY")) $("eOY").value=ny;
  refreshXML(); scheduleRender();
});

/* ================= toolbar / files ================= */
$("btnGame").onclick=()=>$("fGame").click();
$("btnIR").onclick=()=>$("fIR").click();
$("btnGtp").onclick=()=>$("fGtp").click();
$("btnXml").onclick=()=>$("fXml").click();
$("fGame").onchange=e=>{ for(const f of e.target.files) gameFiles.set(baseName(f.webkitRelativePath||f.name),f); texCache.clear(); setStatus(`game/ loaded: ${gameFiles.size} files`,"good"); updateBadges(); if(pickerSprite) drawFramePicker(); scheduleRender(); };
$("fIR").onchange=e=>{
  const sel=$("rendererSel"); sel.innerHTML=""; irFiles.clear();
  const xmls=[...e.target.files].filter(f=>/\.xml$/i.test(f.name)).sort((a,b)=>a.name.localeCompare(b.name));
  xmls.forEach(f=>{ irFiles.set(f.name.toLowerCase(),f); const o=document.createElement("option"); o.value=f.name.toLowerCase(); o.textContent=f.name; sel.appendChild(o); });
  setStatus(`ItemRenderers/ loaded: ${xmls.length} files`,"good");
  if(xmls.length){ sel.value=xmls[0].name.toLowerCase(); openRenderer(sel.value); }
};
$("rendererSel").onchange=e=>openRenderer(e.target.value);
$("btnReload").onclick=()=>{ const k=$("rendererSel").value; if(irFiles.has(k)) openRenderer(k); };
async function openRenderer(key){ const f=irFiles.get(key); if(!f){ setStatus("file not found in memory","warn"); return; } try{ const text=await f.text(); loadXMLString(text,f.name); }catch(err){ setStatus("read failed: "+err.message,"err"); } }
$("fGtp").onchange=e=>{ const f=e.target.files[0]; if(f){
  // Check if it's growtopian2.png (modular parts)
  if(f.name.toLowerCase().includes('growtopian2')){
    const img=new Image();
    img.onload=()=>{
      gtpModular=img;
      setStatus(`Modular growtopian loaded (5 parts: left hand, head, foot, body, right hand @ 32×32 each)`,"good");
      scheduleRender();
    };
    img.onerror=()=>setStatus("growtopian2.png failed to load","warn");
    img.src=URL.createObjectURL(f);
  } else {
    setGtp(URL.createObjectURL(f));
  }
} };
$("fXml").onchange=async e=>{ const f=e.target.files[0]; if(f) loadXMLString(await f.text(),f.name); };

function computeBBox(img){
  const c=document.createElement("canvas"); c.width=img.naturalWidth; c.height=img.naturalHeight;
  const x=c.getContext("2d"); x.drawImage(img,0,0);
  let data; try{ data=x.getImageData(0,0,c.width,c.height).data; }catch(_){ return {x:0,y:0,w:c.width,h:c.height}; }
  let minx=c.width,miny=c.height,maxx=-1,maxy=-1;
  for(let y=0;y<c.height;y++)for(let xx=0;xx<c.width;xx++){ if(data[(y*c.width+xx)*4+3]>10){ if(xx<minx)minx=xx; if(xx>maxx)maxx=xx; if(y<miny)miny=y; if(y>maxy)maxy=y; } }
  if(maxx<0) return {x:0,y:0,w:c.width,h:c.height};
  return {x:minx,y:miny,w:maxx-minx+1,h:maxy-miny+1};
}
function setGtp(url){ const img=new Image(); img.onload=()=>{ gtpImg=img; gtpBox=computeBBox(img); setStatus(`avatar normalized to 34px tall (20×34px Growtopia player bounds); feet at origin (0,0)`,"good"); scheduleRender(); }; img.onerror=()=>setStatus("growtopian.png failed to load","warn"); img.src=url; }

$("cbGrid").onchange=e=>{ showGrid=e.target.checked; scheduleRender(); };
$("cbGtp").onchange=e=>{ showGtp=e.target.checked; scheduleRender(); };
$("cbAnim").onchange=e=>{ animate=e.target.checked; scheduleRender(); };
$("cbState").onchange=e=>{ obeyState=e.target.checked; renderLayerList(); scheduleRender(); };
$("cbDim").onchange=e=>{ dimOthers=e.target.checked; scheduleRender(); };
$("actionSel").onchange=e=>{ action=e.target.value; renderLayerList(); scheduleRender(); };
$("facingSel").onchange=e=>{ facing=e.target.value; renderLayerList(); scheduleRender(); };
$("zoom").oninput=e=>{ const W=cv.getBoundingClientRect().width,H=cv.getBoundingClientRect().height; const wx=s2wx(W/2),wy=s2wy(H/2); zoom=+e.target.value; panX=W/2-wx*zoom; panY=H/2-wy*zoom; scheduleRender(); };
$("btnReset").onclick=recenter;
$("btnAdd").onclick=addLayer;
$("btnCopy").onclick=()=>{ $("xml").select(); document.execCommand("copy"); setStatus("XML copied","good"); };
$("btnFormat").onclick=()=>{ if(!doc) return; $("xml").value=prettyXML(serialize()); applyFromTextarea(); };
$("btnDl").onclick=()=>{ const b=new Blob([$("xml").value],{type:"application/xml"}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=rendererName+".xml"; a.click(); URL.revokeObjectURL(a.href); };

/* live editable XML */
function applyFromTextarea(){
  const text=$("xml").value;
  suppressXMLWrite=true;
  const ok=loadXMLString(text,null,true);
  suppressXMLWrite=false;
  if(ok) setStatus("applied edits from XML box","good");
}
$("xml").addEventListener("input",()=>{ clearTimeout(xmlTimer); xmlTimer=setTimeout(applyFromTextarea,450); });

window.addEventListener("resize",()=>{ scheduleRender(); if(pickerSprite) drawFramePicker(); });

/* auto-load over http */
async function tryAutoLoad(){
  // Try growtopian2.png first (modular)
  try{
    const r=await fetch("growtopian2.png");
    if(r.ok){
      const img=new Image();
      img.onload=()=>{ gtpModular=img; setStatus(`Modular growtopian loaded (5 parts @ 32×32)`,"good"); scheduleRender(); };
      img.src="growtopian2.png";
      return;
    }
  }catch(_){}
  // Fallback to growtopian.png
  try{ const r=await fetch("growtopian.png"); if(r.ok) setGtp("growtopian.png"); }catch(_){}
}

recenter(); tryAutoLoad();
setStatus("Ready. Load game/ + an XML, optionally growtopian.png. Origin (0,0) = player's feet (Growtopia standard).");

