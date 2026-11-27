/* Notes d'orateur du gabarit. À charger après deck-stage.js. Les notes sont l'attribut data-speaker-notes de chaque <section>
   (un « ⚠ » dans une note passe à la ligne en rouge).
   Touches : N notes sous la slide · O mode orateur plein cadre dans cette fenêtre · P fenêtre orateur séparée
   (bloquée dans un artefact claude.ai : retombe sur O) · F plein écran.
   Deux fenêtres du même deck se suivent par BroadcastChannel. Le canal porte le chemin de la page : deux decks ouverts
   en même temps ne se pilotent pas l'un l'autre. */
(()=>{const deck=document.querySelector('deck-stage');if(!deck)return;
const secs=()=>[...deck.querySelectorAll(':scope>section')];
const panel=document.createElement('div');panel.id='notes-panel';panel.hidden=true;document.body.appendChild(panel);
const ora=document.createElement('div');ora.id='orateur';ora.hidden=true;ora.innerHTML='<div class="or-top"><b id="or-pos"></b><span id="or-lab"></span><span id="or-clock"></span></div><div id="or-body"></div><div class="or-next" id="or-next"></div><div class="or-help">← → changer de slide · O quitter le mode orateur · F plein écran</div>';document.body.appendChild(ora);
let pop=null,t0=0,remote=-1,chan=null;
try{chan=new BroadcastChannel('deck:'+location.pathname);chan.onmessage=e=>{const i=e.data&&e.data.i;if(typeof i==='number'&&i!==deck.index){remote=i;deck.goTo(i);}};}catch(e){}
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const cur=()=>{const s=secs(),i=deck.index||0;return{i,n:s.length,label:s[i]?.dataset.label||'',notes:s[i]?.dataset.speakerNotes||'',next:s[i+1]?.dataset.label||''};};
const body=c=>c.notes?esc(c.notes).replace(/ ?⚠/g,'<br><b>⚠</b>'):'<i>Pas de note sur cette slide.</i>';
function render(){const c=cur();
const html='<div class="np-h"><b>'+(c.i+1)+' / '+c.n+'</b> · '+esc(c.label)+'<span>N : notes · O : mode orateur</span></div><div class="np-b">'+body(c)+'</div><div class="np-n">Ensuite : '+(esc(c.next)||'fin')+'</div>';
panel.innerHTML=html;if(pop&&!pop.closed)pop.document.getElementById('c').innerHTML=html;
document.getElementById('or-pos').textContent=(c.i+1)+' / '+c.n;document.getElementById('or-lab').textContent=c.label;document.getElementById('or-body').innerHTML=body(c);document.getElementById('or-next').textContent='Ensuite : '+(c.next||'fin');ora.querySelector('#or-body').scrollTop=0;}
deck.addEventListener('slidechange',()=>{render();const i=deck.index;if(chan&&i!==remote){try{chan.postMessage({i});}catch(e){}}remote=-1;});
function clock(){if(!t0)t0=Date.now();const d=Math.floor((Date.now()-t0)/1000),m=Math.floor(d/60),h=new Date();return String(h.getHours()).padStart(2,'0')+':'+String(h.getMinutes()).padStart(2,'0')+'  ·  écoulé '+m+' min '+String(d%60).padStart(2,'0');}
setInterval(()=>{if(!ora.hidden)document.getElementById('or-clock').textContent=clock();if(pop&&!pop.closed){const el=pop.document.getElementById('clock');if(el)el.textContent=clock();}},1000);
function toggleOra(){ora.hidden=!ora.hidden;if(!ora.hidden){if(!t0)t0=Date.now();document.getElementById('or-clock').textContent=clock();}render();}
function openPop(){try{pop=window.open('','deck-notes','width=980,height=720');}catch(e){pop=null;}
if(!pop){if(ora.hidden)toggleOra();return;}
/* couleurs lues sur la page : la fenêtre orateur suit les tokens du deck */
const v=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const st=pop.document.createElement('style');st.textContent='body{margin:0;padding:28px 36px;background:'+v('--paper')+';color:'+v('--ink')+';font:28px/1.45 Newsreader,Georgia,serif}#clock{font:700 22px/1 "Space Mono",monospace;color:'+v('--olive')+';margin-bottom:18px}.np-h{font:20px/1.3 "Space Mono",monospace;border-bottom:2px solid '+v('--ink')+';padding-bottom:12px;margin-bottom:18px}.np-h b{font-size:26px}.np-h span{display:none}.np-n{font:20px/1.3 "Space Mono",monospace;color:'+v('--ink-2')+';border-top:1px solid '+v('--ink-2')+';margin-top:22px;padding-top:12px}.np-b b{color:'+v('--hot')+'}';
pop.document.title='Notes — '+document.title;pop.document.head.appendChild(st);pop.document.body.innerHTML='<div id="clock"></div><div id="c"></div>';
if(!t0)t0=Date.now();
pop.document.addEventListener('keydown',e=>{if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();deck.next();}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();deck.prev();}});
render();}
document.addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey)return;const t=e.target;if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA)$/.test(t.tagName)))return;const k=e.key.toLowerCase();
if(k==='n'){panel.hidden=!panel.hidden;render();}
if(k==='o'){toggleOra();}
if(k==='p'){openPop();}
if(k==='f'){try{if(document.fullscreenElement)document.exitFullscreen();else{const r=document.documentElement.requestFullscreen();if(r&&r.catch)r.catch(()=>{});}}catch(err){}}});
render();
})();
