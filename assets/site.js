/* ============================================================
   EDIT ME — one source of truth for the whole site.

   STATS    : every benchmark number shown anywhere. STATS.totals
              is COMPUTED from PROJECTS at load — never hand-edit it.
   PROJECTS : the tree, the grid, the topology graph, the sidebar
              metadata, the hover preview, and the terminal all read
              this. Add a project here and it shows up everywhere.
              `lastTouched` drives the topbar status line and the
              hover preview — there is no separate activity structure.
   ============================================================ */
var STATS = {
  /* totals is filled in by deriveTotals() — do not edit by hand */
  totals: {},
  smalldb: {
    writes:  '5,748/s',
    latency: '<200µs',
    bloom:   '174→321/s',
    speedup: '1.8x',
    fp:      '1%',
    loc:     3200
  }
};

var PROJECTS = [
  { id:'ingest', name:'Ingest', file:'ingest.html', icon:'⇥', status:'wip',
    cat:'kafka layer', chain:0,
    desc:'Kafka-based ingestion layer feeding the pipeline.',
    stats:[['THROUGHPUT','—'],['STATUS','building']], pos:{x:-195,y:-70}, gh:null,
    started:'2026-05', lastTouched:'2026-06-30', loc:480,
    tags:['Kafka','Python','Avro'],
    roadmap:'next: consumer-group offset tracking, then Avro schema-registry validation' },

  { id:'streamline', name:'Streamline', file:'streamline.html', icon:'⇆', status:'wip',
    cat:'etl pipeline', chain:1,
    desc:'Real-time ETL with schema validation between ingest and storage.',
    stats:[['EVENTS','—'],['STATUS','building']], pos:{x:-65,y:-110}, gh:null,
    started:'2026-04', lastTouched:'2026-07-10', loc:620,
    tags:['Python','Arrow','schema'],
    roadmap:'next: windowed aggregation, then an exactly-once sink into SmallDB' },

  { id:'smalldb', name:'SmallDB', file:'smalldb.html', icon:'◫', status:'done', real:true,
    cat:'storage engine · C++20', chain:2,
    desc:'LSM-tree storage engine from scratch: WAL, memtable, sparse-indexed SSTables, bloom filters, background streaming compaction.',
    stats:[['WRITES',STATS.smalldb.writes],['LATENCY',STATS.smalldb.latency]], pos:{x:85,y:-75},
    gh:'https://github.com/1129Chengyuan/smalldb',
    started:'2025-11', lastTouched:'2026-07-20', loc:3200,
    tags:['C++20','WAL','bloom filter','k-way merge'],
    roadmap:'next: leveled compaction to cut write amplification, then block-level compression' },

  { id:'dataform-slots-optimization', name:'Dataform Slots Optimization', file:'dataform-slots.html', icon:'◉', status:'done', real:true,
    cat:'bigquery cost automation',
    desc:'Automated Dataform rewrite pipeline that routes queries between slot reservations and on-demand compute.',
    stats:[['SAVINGS','$50k+/yr'],['STATUS','deployed']], pos:{x:160,y:70}, gh:null,
    started:'2026-07', lastTouched:'2026-07-23', loc:0,
    tags:['BigQuery','Dataform','Cloud Run'],
    roadmap:'next: keep tuning the rewrite heuristics and reservation routing rules' },

  { id:'coreutil', name:'CoreUtil', file:'coreutil.html', icon:'▣', status:'wip',
    cat:'shared library',
    desc:'Shared serialization and networking primitives used across the other projects.',
    stats:[['USED BY','—'],['STATUS','api shifting']], pos:{x:-150,y:70}, gh:null,
    started:'2026-01', lastTouched:'2026-06-15', loc:900,
    tags:['C++20','serialization','sockets'],
    roadmap:'next: freeze the wire format, then add version negotiation so old peers stay readable' }
];

var R = window.SITE_ROOT || '';
var PAGE = window.SITE_PAGE || '';
var $ = function(s){ return document.querySelector(s); };

/* ---------------- derived totals ---------------- */
function deriveTotals(){
  var done = PROJECTS.filter(function(p){ return p.status==='done'; }).length;
  var loc = PROJECTS.reduce(function(a,p){ return a + (p.loc||0); }, 0);
  var latest = PROJECTS.map(function(p){ return p.lastTouched; })
                       .filter(Boolean).sort().slice(-1)[0] || '—';
  STATS.totals = {
    projects: PROJECTS.length,
    done: done,
    inProgress: PROJECTS.length - done,
    lastUpdated: latest,
    loc: loc,
    locStr: '~'+fmtLoc(loc)
  };
}

function fmtLoc(n){ return n >= 1000 ? (n/1000).toFixed(1).replace(/\.0$/,'')+'k' : String(n); }

/* ---------------- shared shell (header / sidebar / dock) ---------------- */
/* Injected into every page except the title card, so the chrome lives in
   exactly one place. */
function mountChrome(){
  if(PAGE==='title') return;

  var header = document.createElement('header');
  header.className = 'head';
  header.innerHTML =
    '<div class="head-l">'+
      '<button id="sidetoggle" aria-label="Toggle file tree" aria-expanded="false">☰</button>'+
      '<a class="brand" href="'+R+'system.html"><b>&gt;</b> Cheng-Yuan Li <em>data engineering · cs</em></a>'+
    '</div>'+
    '<div class="right">'+
      '<a href="'+R+'assets/resume.pdf" target="_blank" rel="noopener">resume</a>'+
      '<a href="https://github.com/1129Chengyuan" target="_blank" rel="noopener">github</a>'+ 
      '<a href="mailto:chengyuan@gatech.edu">email</a>'+ 
    '</div>';

  var backdrop = document.createElement('div');
  backdrop.className = 'side-backdrop'; backdrop.id = 'side-backdrop';

  var side = document.createElement('aside');
  side.className = 'side'; side.id = 'side'; side.setAttribute('aria-label','Site directory');
  side.innerHTML =
    '<div class="caption">DIRECTORY</div>'+
    '<ul class="tree" id="tree"></ul>'+
    '<div class="hint">press <b>/</b> to focus the terminal · <b>tree</b> prints this in plain text</div>';

  var dock = document.createElement('div');
  dock.className = 'dock'; dock.id = 'dock';
  dock.innerHTML =
    '<div class="dock-grip" id="dock-grip" role="separator" aria-orientation="horizontal" aria-label="Resize terminal"></div>'+
    '<div class="dock-bar" id="dock-bar">'+
      '<div class="dock-bar-l">'+
        '<div class="lights" aria-hidden="true"><i></i><i></i><i></i></div>'+
        '<span class="title">bash — site navigation</span>'+
        '<span class="dock-status"><span id="dock-path">~</span> <span class="live2">● live</span></span>'+
      '</div>'+
      '<div class="dock-bar-r">'+
        '<div class="quick">'+
          '<button type="button" data-cmd="ls">ls</button>'+
          '<button type="button" data-cmd="tree">tree</button>'+
          '<button type="button" data-cmd="status">status</button>'+
          '<button type="button" data-cmd="help">help</button>'+
        '</div>'+
        '<button id="dock-min" class="btn" aria-label="Minimize terminal">▼</button>'+
      '</div>'+
    '</div>'+
    '<div class="dock-body" id="dock-body" aria-live="polite"></div>'+
    '<div class="dock-line">'+
      '<span class="ps1" id="ps1">guest@site:~$</span>'+
      '<input id="term-in" type="text" placeholder="type a command…  (try: cd smalldb)" aria-label="Terminal input" autocomplete="off" spellcheck="false">'+
    '</div>';

  document.body.insertBefore(header, document.body.firstChild);
  document.body.insertBefore(backdrop, header.nextSibling);
  document.body.insertBefore(side, backdrop.nextSibling);
  var main = $('main');
  if(main && main.nextSibling) document.body.insertBefore(dock, main.nextSibling);
  else document.body.appendChild(dock);
}

/* ---------------- sidebar directory tree ---------------- */
function buildTree(){
  var el = $('#tree'); if(!el) return;
  var rows = [];
  rows.push('<li><a href="'+R+'system.html" class="'+(PAGE==='system'?'cur':'')+'">~/ <span class="ind">home</span></a></li>');
  rows.push('<li><a href="'+R+'about.html" class="'+(PAGE==='about'?'cur':'')+'">├─ about.md</a></li>');
  rows.push('<li><a href="'+R+'contact.html" class="'+(PAGE==='contact'?'cur':'')+'">├─ contact.sh</a></li>');
  rows.push('<li><a href="'+R+'projects/index.html" class="'+(PAGE==='projects'?'cur':'')+'">└─ projects/</a></li>');
  PROJECTS.forEach(function(p,i){
    var last = i === PROJECTS.length-1;
    rows.push('<li><a href="'+R+'projects/'+p.file+'" class="proj '+(PAGE===p.id?'cur':'')+'">'+
      '<span class="row1">&nbsp;&nbsp;&nbsp;'+(last?'└─':'├─')+' '+p.id+
        '<span class="st '+(p.status==='done'?'g':'r')+'">●</span></span>'+
      '<span class="row2">'+(last?'&nbsp;':'│')+'&nbsp;&nbsp;&nbsp;'+p.lastTouched+' · '+fmtLoc(p.loc)+' loc</span>'+
      '</a></li>');
  });
  el.innerHTML = rows.join('');
}

/* ---------------- terminal dock ---------------- */
var HIST_KEY='site_term_hist';
function termWrite(html, cls){
  var body = $('#dock-body'); if(!body) return;
  body.innerHTML += '<div class="'+(cls||'')+'">'+html+'</div>';
  body.scrollTop = body.scrollHeight;
  try{ sessionStorage.setItem(HIST_KEY, body.innerHTML); }catch(e){}
}
function termEcho(cmd){ termWrite('<span class="in">'+promptPath()+'$ '+cmd+'</span>'); }
function nav(path){ window.location.href = R + path; }

function runCmd(raw){
  var cmd = raw.trim();
  if(!cmd) return;
  var low = cmd.toLowerCase();
  termEcho(cmd);
  if(low==='clear'){ $('#dock-body').innerHTML=''; try{sessionStorage.removeItem(HIST_KEY);}catch(e){} return; }
  if(low==='help'){ termWrite('<span class="ok">help</span>  list commands<br>'+
    '<span class="ok">ls</span>    list projects<br>'+
    '<span class="ok">cd &lt;project|..&gt;</span>  open a project page<br>'+
    '<span class="ok">open &lt;page&gt;</span>  home | about | contact | projects<br>'+
    '<span class="ok">status</span>  build status of every project<br>'+
    '<span class="ok">tree</span>  print the site tree<br>'+
    '<span class="ok">view &lt;graph|orbit&gt;</span>  switch the topology layout<br>'+
    '<span class="ok">run &lt;bfs|dfs|dijkstra|reset&gt;</span>  traverse the topology graph<br>'+
    '<span class="ok">whoami</span> · <span class="ok">pwd</span> · <span class="ok">clear</span>'); return; }
  if(low==='ls'){ termWrite(PROJECTS.map(function(p){return p.id+'/';}).join('&nbsp;&nbsp;')); return; }
  if(low==='tree'){ termWrite('~/<br>├─ about.md<br>├─ contact.sh<br>└─ projects/<br>'+
    PROJECTS.map(function(p,i){ return '&nbsp;&nbsp;&nbsp;'+(i===PROJECTS.length-1?'└─':'├─')+' '+p.id+'.html'; }).join('<br>')); return; }
  if(low==='whoami'){ termWrite('guest — the owner of this machine writes storage engines for fun'); return; }
  if(low==='status'){ termWrite(PROJECTS.map(function(p){
    return p.id+': '+(p.status==='done'?'<span class="ok">done</span>':'<span class="err">in progress</span>')+
      ' <span class="dim">· '+p.lastTouched+'</span>'; }).join('<br>')); return; }
  if(low==='pwd'){ termWrite('~/'+(PAGE==='system'||PAGE==='title'?'':PAGE)); return; }
  if(low.indexOf('view')===0 || low.indexOf('topology --mode')===0){
    var m = low.indexOf('view')===0 ? low.slice(4).trim() : low.split('=')[1];
    m = (m||'').trim();
    if(m!=='graph' && m!=='orbit'){ termWrite('usage: view &lt;graph|orbit&gt;','err'); return; }
    if(typeof window.setTopoMode==='function' && window.setTopoMode(m)){
      termWrite('→ topology: '+m+' mode','ok');
    } else {
      try{ sessionStorage.setItem('topo_mode', m); }catch(e){}
      termWrite('→ topology set to '+m+' — open the system screen to see it','ok');
    }
    return;
  }
  if(low.indexOf('run ')===0){
    var alg = low.slice(4).trim();
    if(['bfs','dfs','dijkstra','reset'].indexOf(alg)===-1){ termWrite('usage: run &lt;bfs|dfs|dijkstra|reset&gt;','err'); return; }
    if(typeof window.runTopoAlgo==='function' && window.runTopoAlgo(alg)){
      termWrite(alg==='reset' ? '→ traversal reset' : '→ running '+alg+'…','ok');
    } else {
      termWrite('→ open the system screen to run graph algorithms','ok');
    }
    return;
  }
  if(low.indexOf('sudo')===0){ termWrite('nice try. permission denied.','err'); return; }
  if(low==='cd ..'||low==='cd'||low==='cd ~'){ termWrite('→ ~/','ok'); setTimeout(function(){nav('system.html');},180); return; }
  if(low.indexOf('open ')===0){
    var t = low.slice(5).trim();
    var map = {home:'system.html', about:'about.html', contact:'contact.html', projects:'projects/index.html'};
    if(map[t]){ termWrite('→ '+t,'ok'); setTimeout(function(){nav(map[t]);},180); return; }
    termWrite('no such page: '+t,'err'); return;
  }
  if(low.indexOf('cd ')===0){
    var target = low.slice(3).replace(/\/$/,'').trim();
    var p = PROJECTS.filter(function(x){return x.id===target;})[0];
    if(!p){ termWrite('no such project: '+target+' — try "ls"','err'); return; }
    termWrite('→ projects/'+p.file,'ok');
    setTimeout(function(){ nav('projects/'+p.file); },180); return;
  }
  termWrite('command not found: '+cmd+' — try "help"','err');
}

function promptPath(){
  if(PAGE==='system'||PAGE==='title') return '~';
  if(PAGE==='about') return '~/about';
  if(PAGE==='contact') return '~/contact';
  if(PAGE==='projects') return '~/projects';
  var p = PROJECTS.filter(function(x){return x.id===PAGE;})[0];
  return p ? '~/projects/'+p.id : '~';
}

function initDock(){
  var dock = $('#dock'); if(!dock) return;
  var ps1 = $('#ps1');
  if(ps1) ps1.textContent = 'guest@site:'+promptPath()+'$';
  var dp = $('#dock-path'); if(dp) dp.textContent = promptPath();
  var DEFAULT_TERM = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--term')) || 180;
  var TERM_KEY = 'site_term_h';
  var openDockHeight = DEFAULT_TERM;
  function clampHeight(h){ return Math.min(window.innerHeight - 160, Math.max(120, h)); }
  try{
    var savedH = parseFloat(localStorage.getItem(TERM_KEY));
    if(savedH) openDockHeight = clampHeight(savedH);
  }catch(e){}
  function syncDockHeight(){
    document.documentElement.style.setProperty('--term', (dock.classList.contains('min') ? 36 : openDockHeight) + 'px');
    window.dispatchEvent(new Event('resize'));
  }

  // small screens start collapsed so the terminal doesn't eat the viewport
  if(window.innerWidth < 900){
    dock.classList.add('min');
    var m0 = $('#dock-min'); if(m0) m0.textContent = '▲';
  }

  var body = $('#dock-body');
  if(body){
    var saved=null; try{ saved = sessionStorage.getItem(HIST_KEY); }catch(e){}
    if(saved){ body.innerHTML = saved; body.scrollTop = body.scrollHeight; }
    else { termWrite('<span class="in">'+promptPath()+'$ help</span>');
           termWrite('type <span class="ok">help</span> for commands · <span class="ok">ls</span> to list projects · <span class="ok">cd smalldb</span> to open one'); }
  }

  var input = $('#term-in');
  if(input){
    input.addEventListener('keydown', function(e){
      if(e.key==='Enter' && this.value.trim()){ runCmd(this.value); this.value=''; }
    });
  }

  // quick buttons run their data-cmd
  dock.querySelectorAll('.quick button').forEach(function(b){
    b.addEventListener('click', function(e){ e.stopPropagation(); runCmd(b.getAttribute('data-cmd')); });
  });

  // the WHOLE panel is a click target that focuses the input (or expands)
  dock.addEventListener('click', function(e){
    if(e.target.closest('#dock-min') || e.target.closest('.quick') || e.target.closest('#dock-grip')) return;
    if(dock.classList.contains('min')){ expandDock(); return; }
    if(input) input.focus();
  });

  // drag the top edge to resize; height persists and the page reflows live
  var grip = $('#dock-grip');
  if(grip){
    var dragStartY=0, dragStartH=0, dragging=false;
    grip.addEventListener('pointerdown', function(e){
      if(dock.classList.contains('min')) return;
      dragging=true; dragStartY=e.clientY; dragStartH=openDockHeight;
      dock.classList.add('resizing'); document.body.classList.add('resizing-dock');
      grip.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    grip.addEventListener('pointermove', function(e){
      if(!dragging) return;
      openDockHeight = clampHeight(dragStartH + (dragStartY - e.clientY));
      syncDockHeight();
    });
    function endDrag(e){
      if(!dragging) return;
      dragging=false;
      dock.classList.remove('resizing'); document.body.classList.remove('resizing-dock');
      try{ grip.releasePointerCapture(e.pointerId); }catch(err){}
      try{ localStorage.setItem(TERM_KEY, String(openDockHeight)); }catch(err){}
    }
    grip.addEventListener('pointerup', endDrag);
    grip.addEventListener('pointercancel', endDrag);
    grip.addEventListener('dblclick', function(){
      openDockHeight = DEFAULT_TERM;
      syncDockHeight();
      try{ localStorage.setItem(TERM_KEY, String(openDockHeight)); }catch(err){}
    });
  }

  function expandDock(){
    dock.classList.remove('min');
    var m=$('#dock-min'); if(m) m.textContent='▼';
    if(input) input.focus();
    requestAnimationFrame(syncDockHeight);
  }
  var min = $('#dock-min');
  if(min) min.addEventListener('click', function(e){
    e.stopPropagation();
    dock.classList.toggle('min');
    this.textContent = dock.classList.contains('min') ? '▲' : '▼';
    if(!dock.classList.contains('min') && input) input.focus();
    requestAnimationFrame(syncDockHeight);
  });

  if('ResizeObserver' in window){
    var dockObserver = new ResizeObserver(syncDockHeight);
    dockObserver.observe(dock);
  }
  syncDockHeight();

  document.addEventListener('keydown', function(e){
    if(e.key==='/' && document.activeElement!==input && input){
      e.preventDefault();
      if(dock.classList.contains('min')) expandDock();
      input.focus();
    }
  });
}

/* ---------------- sidebar toggle ---------------- */
function initSidebar(){
  var side = $('#side'), backdrop = $('#side-backdrop'), st = $('#sidetoggle');
  if(!side || !st) return;
  function open(){ side.classList.add('open'); if(backdrop) backdrop.classList.add('on'); st.setAttribute('aria-expanded','true'); }
  function close(){ side.classList.remove('open'); if(backdrop) backdrop.classList.remove('on'); st.setAttribute('aria-expanded','false'); }
  st.addEventListener('click', function(){ side.classList.contains('open') ? close() : open(); });
  if(backdrop) backdrop.addEventListener('click', close);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });
}

/* ---------------- project grid (projects/index only) ---------------- */
function buildGrid(){
  var g = $('#grid'); if(!g) return;
  var count = $('#proj-count');
  if(count) count.textContent = String(PROJECTS.length).padStart(2,'0')+' tracked · '+
    STATS.totals.done+' done · '+STATS.totals.inProgress+' in progress';
  g.innerHTML = PROJECTS.map(function(p){
    return '<a class="card" href="'+R+'projects/'+p.file+'">'+
      '<div class="card-top"><div class="ico'+(p.status==='wip'?' wip':'')+'">'+p.icon+'</div>'+
      '<span class="status '+(p.status==='done'?'done':'wip')+'"><span class="dot '+(p.status==='done'?'g':'r')+'"></span>'+
      (p.status==='done'?'DONE':'IN PROGRESS')+'</span></div>'+
      '<h3>'+p.name+'</h3><div class="cat">'+p.cat+'</div><p>'+p.desc+'</p>'+
      '<div class="mini">'+p.stats.map(function(s){
        return '<div><div class="k">'+s[0]+'</div><div class="v">'+s[1]+'</div></div>';}).join('')+'</div>'+
      '<div class="card-foot"><span>'+p.lastTouched+'</span><span class="go">open →</span></div></a>';
  }).join('');
}

/* ---------------- inject shared stats ---------------- */
function injectStats(){
  document.querySelectorAll('[data-stat]').forEach(function(el){
    var path = el.getAttribute('data-stat').split('.');
    var v = STATS;
    for(var i=0;i<path.length;i++){ v = v && v[path[i]]; }
    if(v !== undefined && v !== null) el.textContent = v;
  });
}

/* ---------------- disable dead source links ---------------- */
function markDeadLinks(){
  var page = PROJECTS.filter(function(p){ return p.id === PAGE; })[0];
  var btn = $('#src-link');
  if(!btn) return;
  if(page && page.gh){
    btn.href = page.gh; btn.removeAttribute('aria-disabled');
  } else {
    btn.classList.add('disabled');
    btn.removeAttribute('href');
    btn.setAttribute('aria-disabled','true');
    btn.title = 'source not published yet';
    btn.textContent = 'source not published yet';
  }
}

/* ---------------- project tab switcher (shared) ---------------- */
function tab(btn,id){
  btn.parentElement.querySelectorAll('button').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  document.querySelectorAll('.pane').forEach(function(p){p.classList.remove('on');});
  var pane = document.getElementById('pane-'+id); if(pane) pane.classList.add('on');
}

/* ---------------- project page meta (roadmap + timeline) ---------------- */
/* fills #p-roadmap and #p-timeline from PROJECTS so dates/plans live in one
   place, never typed into the project HTML twice. */
function renderProjectMeta(){
  var p = PROJECTS.filter(function(x){ return x.id === PAGE; })[0];
  if(!p) return;
  var rm = $('#p-roadmap');
  if(rm){
    rm.classList.add('roadmap');
    if(p.status!=='done') rm.classList.add('wip');
    var label = p.status==='done' ? 'what’s next' : 'roadmap';
    rm.innerHTML = '<b>'+label+' →</b> <span>'+p.roadmap+'</span>';
  }
  var tl = $('#p-timeline');
  if(tl){
    tl.classList.add('timeline-strip');
    tl.innerHTML = '<span class="node">started '+p.started+'</span>'+
      '<span class="bar'+(p.status==='done'?'':' wip')+'"></span>'+
      '<span class="node">last touched '+p.lastTouched+'</span>';
  }
}

/* ---------------- /system topbar status line ---------------- */
/* one line, right-aligned in the topbar — never a panel. */
function buildStatusLine(){
  var el = $('#sys-status'); if(!el) return;
  var t = STATS.totals;
  var upd = (t.lastUpdated || '').slice(5); // YYYY-MM-DD -> MM-DD
  el.textContent = t.projects+' tracked · '+t.done+' done · updated '+upd;
}

/* ---------------- ambient particles (system only) ---------------- */
function buildParticles(){
  var box = $('#particles'); if(!box) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var n = 18, html='';
  for(var i=0;i<n;i++){
    var x=Math.round(Math.random()*100), y=Math.round(Math.random()*100);
    var sz=(Math.random()*2+1).toFixed(1);
    var dur=(Math.random()*18+14).toFixed(1), delay=(-Math.random()*20).toFixed(1);
    var op=(Math.random()*0.22+0.06).toFixed(2);
    html+='<i style="left:'+x+'%;top:'+y+'%;width:'+sz+'px;height:'+sz+'px;opacity:'+op+
      (reduce?'':';animation-duration:'+dur+'s;animation-delay:'+delay+'s')+'"></i>';
  }
  box.innerHTML=html;
}

/* ---------------- topology graph (system only) ----------------
   Two presentation modes over the same nodes/edges/handlers:
   'graph' (hub-and-spoke, rotating — runs bfs/dfs/dijkstra) and
   'orbit' (solar-system, recency bands + ambient cosmos). */
function buildGraph(){
  var scene = $('#scene'); if(!scene) return;
  var preview = $('#topo-preview');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var focal=430, baseZ=390, paused=false;
  var pById={}; PROJECTS.forEach(function(p){ pById[p.id]=p; });
  var nodes = [{id:'you',label:'you',icon:'>',x:0,y:0,core:true,r:18,loc:0}].concat(
    PROJECTS.map(function(p){ return {id:p.id,label:p.name,icon:p.icon,x:p.pos.x,y:p.pos.y,
      status:p.status,r:p.real?15:11,desc:p.desc,file:p.file,loc:p.loc}; }));
  var byId={}; nodes.forEach(function(n){byId[n.id]=n;});
  var chain = PROJECTS.filter(function(p){return p.chain!==undefined;})
                      .sort(function(a,b){return a.chain-b.chain;});
  var standalone = PROJECTS.filter(function(p){return p.chain===undefined;});

  /* --- graph-mode edges (plain + undirected at rest; every edge can grow
     an arrowcap + weight label once an algorithm starts walking it) --- */
  var edges=[];
  for(var i=0;i<chain.length-1;i++) edges.push({a:byId[chain[i].id],b:byId[chain[i+1].id],chain:true});
  edges.push({a:byId.you,b:byId[chain[0].id],chain:true});
  standalone.forEach(function(p){ edges.push({a:byId.you,b:byId[p.id]}); });
  var adj={}; nodes.forEach(function(n){ adj[n.id]=[]; });
  edges.forEach(function(e){
    var d=document.createElement('div');
    d.className='tedge '+(e.chain?'chain':'hub');
    var cap=document.createElement('span'); cap.className='arrowcap'; d.appendChild(cap);
    scene.appendChild(d); e.el=d;
    e.w = Math.max(1, Math.round((e.b.loc||1)/100));
    var wl=document.createElement('div'); wl.className='edge-w'; wl.textContent=e.w; scene.appendChild(wl); e.wEl=wl;
    adj[e.a.id].push({to:e.b.id, edge:e}); adj[e.b.id].push({to:e.a.id, edge:e});
  });

  /* --- orbit-mode rings = recency bands (nodes sit exactly on their band's
     ellipse; ring color is neutral — status stays a node property only) --- */
  var latest = STATS.totals.lastUpdated;
  function daysAgo(d){ return Math.round((new Date(latest) - new Date(d))/86400000); }
  var bands=[
    {key:'active', rf:0.40, label:'≤30d',  max:30,       members:[]},
    {key:'recent', rf:0.70, label:'≤90d',  max:90,       members:[]},
    {key:'dormant',rf:0.98, label:'90d+',  max:Infinity, members:[]}
  ];
  PROJECTS.forEach(function(p){
    var age=daysAgo(p.lastTouched);
    (bands.filter(function(b){return age<=b.max;})[0] || bands[bands.length-1]).members.push(p);
  });
  bands.forEach(function(b){
    var n=b.members.length, speed=(b.key==='active'?0.00032:b.key==='recent'?0.00020:0.00012);
    b.items = b.members.map(function(p,i){
      return { id:p.id, phase:i*(2*Math.PI/Math.max(1,n))+Math.random()*0.4,
        speed: speed*(i%2?-1:1)*(0.85+Math.random()*0.3) };
    });
    var ring=document.createElement('div'); ring.className='orbit-ring'; scene.appendChild(ring);
    var lbl=document.createElement('div'); lbl.className='orbit-lbl'; lbl.textContent=b.label; scene.appendChild(lbl);
    b.ring=ring; b.lblEl=lbl;
    if(!n) ring.style.opacity='.4';
  });

  /* --- orbit ambience: starfield / asteroid belt / Falcon+TIE skirmish,
     drawn on one canvas behind the nodes so it costs one draw call, not
     a hundred animated elements. Kept light on purpose: the Falcon just
     reskins the old courier ship (same target-hopping/ping behavior), the
     TIE only shows up while it's traveling, and shots are rare. --- */
  var fx = $('#orbit-fx'), fctx = fx && fx.getContext('2d');
  /* shared radial unit so rings, the asteroid belt, and the battle pocket all
     scale together and spread to fill the scene's width instead of bunching
     around min(W,H)/2 */
  function orbitUnit(W,H){ return Math.min(W*0.46, H*0.46/0.52); }
  var stars=[], asteroids=[], pings=[], bolts=[], sparks=[];
  (function initStars(){ for(var i=0;i<110;i++) stars.push(
    {x:Math.random(), y:Math.random(), r:0.4+Math.random(), ph:Math.random()*Math.PI*2, sp:0.5+Math.random()*1.2}); })();
  (function initAsteroids(){ for(var i=0;i<36;i++) asteroids.push(
    {rf:0.80+Math.random()*0.10, phase:Math.random()*Math.PI*2,
     speed:(i%2?-1:1)*(0.00005+Math.random()*0.00006), size:1.4+Math.random()*2.2,
     spin:Math.random()*Math.PI*2, spinSpeed:(Math.random()-0.5)*0.003}); })();
  var ship={x:null,y:null,angle:0,target:null,dockId:null,mode:'hold',holdUntil:800,trail:[],fadeFrom:0};
  function resizeFx(){
    if(!fx) return;
    var W=scene.clientWidth||900, H=scene.clientHeight||460, dpr=window.devicePixelRatio||1;
    fx.width=Math.round(W*dpr); fx.height=Math.round(H*dpr);
    fx.style.width=W+'px'; fx.style.height=H+'px';
    if(fctx) fctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function pickShipTarget(exclude){
    var opts=PROJECTS.filter(function(p){return p.id!==exclude;});
    return opts[Math.floor(Math.random()*opts.length)].id;
  }
  function updateShip(){
    if(ship.x===null){ ship.x=byId.you._sx||0; ship.y=byId.you._sy||0; }
    if(ship.mode==='dock'){
      /* landed: ride the node's current position (it keeps orbiting) instead
         of freezing in mid-air, and stay invisible until departure */
      var dn=byId[ship.dockId];
      if(dn && dn._sx!==undefined){ ship.x=dn._sx; ship.y=dn._sy; }
      if(clock>=ship.holdUntil){
        ship.target=pickShipTarget(ship.dockId); ship.mode='travel'; ship.fadeFrom=clock;
      }
      return;
    }
    if(ship.mode==='hold'){
      if(clock>=ship.holdUntil){ ship.target=pickShipTarget(ship.target); ship.mode='travel'; ship.fadeFrom=clock; }
      return;
    }
    var n=byId[ship.target]; if(!n||n._sx===undefined) return;
    var dx=n._sx-ship.x, dy=n._sy-ship.y, dist=Math.hypot(dx,dy);
    if(dist<4){
      ship.mode='dock'; ship.dockId=ship.target; ship.holdUntil=clock+2200;
      pings.push({x:ship.x,y:ship.y,born:clock}); ship.trail=[];
      return;
    }
    var step=Math.min(dist,0.085*Math.min(60,dt));
    ship.angle=Math.atan2(dy,dx);
    ship.x+=(dx/dist)*step; ship.y+=(dy/dist)*step;
    ship.trail.push({x:ship.x,y:ship.y,born:clock});
    if(ship.trail.length>16) ship.trail.shift();
  }
  /* --- battle pocket: an X-wing and a small TIE squadron dogfight in a
     corner near the Death Star, completely independent of the Falcon (it
     used to despawn whenever the Falcon docked — now nothing here reads
     ship.mode at all). Confined to a fixed-radius arena so it never drifts
     over the node field; dropped below ~560px like the Death Star. --- */
  function arenaFor(W,H){ return {cx:W*0.15, cy:H*0.20, r:Math.max(70,Math.min(130,Math.min(W,H)*0.20))}; }
  var TIE_N=3;
  var ties=[], tieSpawnQueue=0;
  var xwing={x:0,y:0,angle:0,vx:0,vy:0,nextFire:2000,init:false};
  function spawnTie(delay){
    ties.push({x:0,y:0,angle:0,vx:0,vy:0,state:'launch',born:clock+ (delay||0),
      weave:Math.random()*Math.PI*2, nextFire:clock+1500+Math.random()*1500});
  }
  (function seedTies(){ for(var i=0;i<TIE_N;i++) spawnTie(i*260); })();
  function fireBolt(x,y,tx,ty,side){
    var a=Math.atan2(ty-y,tx-x)+(Math.random()-0.5)*0.1;
    bolts.push({x0:x,y0:y,dx:Math.cos(a),dy:Math.sin(a),speed:side==='tie'?0.42:0.5,born:clock,side:side});
    if(bolts.length>20) bolts=bolts.slice(-20);
  }
  function updateArena(){
    if(reduce) return;
    var W=scene.clientWidth||900, H=scene.clientHeight||460;
    if(W<560){ return; }
    var A=arenaFor(W,H);
    if(!xwing.init){ xwing.x=A.cx+A.r*0.6; xwing.y=A.cy+A.r*0.6; xwing.init=true; }

    /* X-wing: banks toward the nearest live TIE, stays inside the arena,
       fires when roughly lined up. Never dies. */
    var live=ties.filter(function(t){return t.state==='fight';});
    var tgt=null, best=1e9;
    live.forEach(function(t){ var d=Math.hypot(t.x-xwing.x,t.y-xwing.y); if(d<best){best=d;tgt=t;} });
    var desiredA = tgt ? Math.atan2(tgt.y-xwing.y, tgt.x-xwing.x) : xwing.angle+0.01;
    var da=((desiredA-xwing.angle+Math.PI*3)%(Math.PI*2))-Math.PI;
    xwing.angle += Math.max(-0.05,Math.min(0.05,da))*Math.min(60,dt)/16;
    var speed=0.055;
    xwing.x += Math.cos(xwing.angle)*speed*Math.min(60,dt);
    xwing.y += Math.sin(xwing.angle)*speed*Math.min(60,dt);
    var edx=xwing.x-A.cx, edy=xwing.y-A.cy, edist=Math.hypot(edx,edy);
    if(edist>A.r){ xwing.x=A.cx+edx/edist*A.r; xwing.y=A.cy+edy/edist*A.r; }
    if(tgt && best<A.r*1.6 && Math.abs(da)<0.6 && clock>=xwing.nextFire){
      fireBolt(xwing.x,xwing.y,tgt.x,tgt.y,'falcon');
      xwing.nextFire=clock+1200+Math.random()*1300;
    }

    ties.forEach(function(t){
      if(t.state==='launch'){
        if(clock<t.born) return;
        var age=clock-t.born, dur=400;
        if(t._a0===undefined){ t._a0=Math.random()*Math.PI*2; t.x=A.cx; t.y=A.cy; }
        var p=Math.min(1,age/dur);
        t.x=A.cx+Math.cos(t._a0)*A.r*0.5*p; t.y=A.cy+Math.sin(t._a0)*A.r*0.5*p; t.angle=t._a0;
        if(p>=1) t.state='fight';
        return;
      }
      if(t.state==='dying'){
        if(clock>=t.deadAt){ ties.splice(ties.indexOf(t),1); tieSpawnQueue++; }
        return;
      }
      /* fight: chase the X-wing with a lead offset, weave, and mutual
         separation so the squadron fans out instead of stacking */
      t.weave += 0.003*Math.min(60,dt);
      var lead=25, bx=xwing.x+Math.cos(xwing.angle)*lead+Math.cos(t.weave)*14;
      var by=xwing.y+Math.sin(xwing.angle)*lead+Math.sin(t.weave)*14;
      var dx=bx-t.x, dy=by-t.y, dist=Math.hypot(dx,dy)||1;
      var sepx=0, sepy=0;
      ties.forEach(function(o){ if(o===t||o.state!=='fight') return;
        var ox=t.x-o.x, oy=t.y-o.y, od=Math.hypot(ox,oy)||1;
        if(od<28){ sepx+=ox/od*(28-od); sepy+=oy/od*(28-od); } });
      var vx=dx/dist+sepx*0.08, vy=dy/dist+sepy*0.08, vlen=Math.hypot(vx,vy)||1;
      t.angle=Math.atan2(vy,vx);
      var step=0.06*Math.min(60,dt);
      t.x+=(vx/vlen)*step; t.y+=(vy/vlen)*step;
      var tdx=t.x-A.cx, tdy=t.y-A.cy, tdist=Math.hypot(tdx,tdy);
      if(tdist>A.r){ t.x=A.cx+tdx/tdist*A.r; t.y=A.cy+tdy/tdist*A.r; }
      if(clock>=t.nextFire && dist<A.r*1.7){
        fireBolt(t.x,t.y,xwing.x,xwing.y,'tie');
        t.nextFire=clock+1500+Math.random()*1500;
      }
      var hd=Math.hypot(xwing.x-t.x,xwing.y-t.y);
      if(hd<10 && Math.random()<0.02){
        sparks.push({x:t.x,y:t.y,born:clock,size:1}); if(sparks.length>8) sparks=sparks.slice(-8);
        t.state='dying'; t.deadAt=clock+350;
      }
    });
    if(tieSpawnQueue>0 && ties.length<TIE_N){ tieSpawnQueue--; spawnTie(1500+Math.random()*1500); }

    /* stray TIE bolts near the X-wing read as deflections, not kills */
    bolts.forEach(function(b){
      if(b.side!=='tie'||b._resolved) return;
      var age=clock-b.born, hx=b.x0+b.dx*b.speed*age, hy=b.y0+b.dy*b.speed*age;
      if(Math.hypot(hx-xwing.x,hy-xwing.y)<8){
        b._resolved=true;
        sparks.push({x:hx,y:hy,born:clock,size:0.6}); if(sparks.length>8) sparks=sparks.slice(-8);
      }
    });
  }
  function drawDeathStar(W,H){
    if(W<560) return;
    var A=arenaFor(W,H), r=Math.max(20,Math.min(26,A.r*0.28)), dx=A.cx, dy=A.cy;
    fctx.save();
    fctx.fillStyle='rgba(154,157,165,.10)';
    fctx.beginPath(); fctx.arc(dx,dy,r,0,Math.PI*2); fctx.fill();
    fctx.strokeStyle='rgba(154,157,165,.20)'; fctx.lineWidth=1; fctx.stroke();
    fctx.beginPath(); fctx.moveTo(dx-r,dy+r*0.15); fctx.lineTo(dx+r,dy+r*0.15); fctx.stroke();
    fctx.beginPath(); fctx.arc(dx+r*0.35,dy-r*0.35,r*0.28,0,Math.PI*2); fctx.stroke();
    fctx.restore();
  }
  function drawFalcon(x,y,angle,alpha){
    fctx.save(); fctx.translate(x,y); fctx.rotate(angle); fctx.globalAlpha=alpha===undefined?1:alpha;
    fctx.shadowColor='#5dc9f2'; fctx.shadowBlur=5;
    fctx.fillStyle='rgba(200,206,214,.92)';
    fctx.beginPath(); fctx.ellipse(0,0,6.5,5.5,0,0,Math.PI*2); fctx.fill();
    fctx.beginPath(); fctx.moveTo(6,-1.6); fctx.lineTo(11,-2.4); fctx.lineTo(11,-0.6); fctx.lineTo(6,0.4); fctx.closePath(); fctx.fill();
    fctx.beginPath(); fctx.moveTo(6,1.6); fctx.lineTo(11,2.4); fctx.lineTo(11,0.6); fctx.lineTo(6,-0.4); fctx.closePath(); fctx.fill();
    fctx.shadowBlur=0; fctx.fillStyle='rgba(93,201,242,.85)';
    fctx.beginPath(); fctx.arc(2,-3.2,1.3,0,Math.PI*2); fctx.fill();
    fctx.restore();
  }
  function drawTie(x,y,angle,alpha){
    fctx.save(); fctx.translate(x,y); fctx.rotate(angle); fctx.globalAlpha=alpha;
    fctx.shadowColor='#e2564d'; fctx.shadowBlur=4;
    fctx.strokeStyle='rgba(220,120,110,.9)'; fctx.lineWidth=1.3;
    [-6,6].forEach(function(cy){
      fctx.beginPath();
      fctx.moveTo(-1.5,cy-4); fctx.lineTo(1.5,cy-4); fctx.lineTo(3,cy);
      fctx.lineTo(1.5,cy+4); fctx.lineTo(-1.5,cy+4); fctx.lineTo(-3,cy); fctx.closePath(); fctx.stroke();
    });
    fctx.beginPath(); fctx.moveTo(0,-2); fctx.lineTo(0,2); fctx.stroke();
    fctx.shadowBlur=0; fctx.fillStyle='rgba(230,150,140,.9)';
    fctx.beginPath(); fctx.arc(0,0,2.2,0,Math.PI*2); fctx.fill();
    fctx.restore();
  }
  function drawXwing(x,y,angle){
    fctx.save(); fctx.translate(x,y); fctx.rotate(angle);
    fctx.shadowColor='#5df29a'; fctx.shadowBlur=5;
    fctx.fillStyle='rgba(206,212,218,.92)';
    fctx.beginPath(); fctx.moveTo(9,0); fctx.lineTo(-6,-2.6); fctx.lineTo(-4,0); fctx.lineTo(-6,2.6); fctx.closePath(); fctx.fill();
    fctx.strokeStyle='rgba(206,212,218,.9)'; fctx.lineWidth=1.2; fctx.shadowBlur=2;
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(function(s){
      fctx.beginPath(); fctx.moveTo(-1,0); fctx.lineTo(-1+7*s[0],7*s[1]); fctx.stroke();
    });
    fctx.shadowBlur=0; fctx.fillStyle='rgba(93,242,154,.85)';
    fctx.beginPath(); fctx.arc(2,0,1.1,0,Math.PI*2); fctx.fill();
    fctx.restore();
  }
  function drawFX(){
    if(!fctx) return;
    var W=scene.clientWidth||900, H=scene.clientHeight||460, cx=W/2, cy=H/2, unit=orbitUnit(W,H);
    if(!xwing.init){ var A0=arenaFor(W,H); xwing.x=A0.cx+A0.r*0.6; xwing.y=A0.cy+A0.r*0.6; xwing.init=true; }
    fctx.clearRect(0,0,W,H);
    stars.forEach(function(s){
      var tw=reduce?0.7:(0.5+0.5*Math.sin(clock*0.0006*s.sp+s.ph));
      fctx.globalAlpha=0.12+0.5*tw; fctx.fillStyle='#cfe9d8';
      fctx.beginPath(); fctx.arc(s.x*W, s.y*H, s.r, 0, Math.PI*2); fctx.fill();
    });
    fctx.globalAlpha=1;
    drawDeathStar(W,H);
    asteroids.forEach(function(a){
      var rx=unit*a.rf, ry=rx*0.52, ang=a.phase+(reduce?0:clock*a.speed);
      var ax=cx+rx*Math.cos(ang), ay=cy+ry*Math.sin(ang), sp=a.spin+(reduce?0:clock*a.spinSpeed);
      fctx.save(); fctx.translate(ax,ay); fctx.rotate(sp); fctx.fillStyle='rgba(154,157,165,.55)';
      fctx.beginPath();
      fctx.moveTo(-a.size,-a.size*0.6); fctx.lineTo(a.size*0.7,-a.size); fctx.lineTo(a.size,a.size*0.5);
      fctx.lineTo(0,a.size); fctx.lineTo(-a.size*0.8,a.size*0.4); fctx.closePath(); fctx.fill();
      fctx.restore();
    });
    pings = pings.filter(function(p){ return clock-p.born<900; });
    pings.forEach(function(p){
      var t=(clock-p.born)/900;
      fctx.globalAlpha=Math.max(0,1-t)*0.5; fctx.strokeStyle='#5dc9f2'; fctx.lineWidth=1.5;
      fctx.beginPath(); fctx.arc(p.x,p.y,6+t*22,0,Math.PI*2); fctx.stroke();
    });
    fctx.globalAlpha=1;
    bolts = bolts.filter(function(b){ return clock-b.born<450; });
    bolts.forEach(function(b){
      if(clock<b.born) return;
      var age=clock-b.born, hx=b.x0+b.dx*b.speed*age, hy=b.y0+b.dy*b.speed*age;
      fctx.globalAlpha=Math.max(0,1-age/450);
      fctx.strokeStyle=b.side==='tie'?'#e2564d':'#5df29a'; fctx.lineWidth=1.5;
      fctx.beginPath(); fctx.moveTo(hx-b.dx*8,hy-b.dy*8); fctx.lineTo(hx,hy); fctx.stroke();
    });
    fctx.globalAlpha=1;
    sparks = sparks.filter(function(s){ return clock-s.born<300; });
    sparks.forEach(function(s){
      var t=(clock-s.born)/300, sz=s.size||1;
      fctx.globalAlpha=Math.max(0,1-t)*0.8; fctx.strokeStyle='#e8b13c'; fctx.lineWidth=1.2;
      for(var i=0;i<5;i++){
        var a=i*(Math.PI*2/5), rr=(2+t*7)*sz;
        fctx.beginPath(); fctx.moveTo(s.x,s.y); fctx.lineTo(s.x+Math.cos(a)*rr,s.y+Math.sin(a)*rr); fctx.stroke();
      }
    });
    fctx.globalAlpha=1;
    if(W>=560){
      if(!reduce) ties.forEach(function(t){
        if(t.state==='dying'){
          var age=350-(t.deadAt-clock);
          drawTie(t.x,t.y,t.angle,Math.max(0,1-age/350));
        } else if(t.state!=='launch' || clock>=t.born){
          drawTie(t.x,t.y,t.angle,1);
        }
      });
      drawXwing(xwing.x, xwing.y, xwing.angle);
    }
    ship.trail.forEach(function(pt,i){
      var age=(clock-pt.born)/500;
      fctx.globalAlpha=Math.max(0,1-age)*0.5*(i/ship.trail.length);
      fctx.fillStyle='#5dc9f2'; fctx.beginPath(); fctx.arc(pt.x,pt.y,1.3,0,Math.PI*2); fctx.fill();
    });
    fctx.globalAlpha=1;
    if(ship.mode!=='dock'){
      var fadeT=reduce?1:Math.min(1,(clock-ship.fadeFrom)/250);
      drawFalcon(ship.x, ship.y, ship.angle, fadeT);
      if(ship.mode==='travel' && byId[ship.target]){
        fctx.globalAlpha=fadeT;
        fctx.fillStyle='#9a9da5'; fctx.font='9px ui-monospace,monospace'; fctx.textAlign='center';
        fctx.fillText('→ '+byId[ship.target].label, ship.x, ship.y+16);
        fctx.globalAlpha=1;
      }
    }
  }

  /* --- nodes (shared across modes) --- */
  nodes.forEach(function(n){
    var d=document.createElement('div'); d.className='tnode'+(n.core?' core':' hit');
    var ring=document.createElement('div'); ring.className='ring';
    ring.style.borderStyle='solid'; ring.style.borderWidth='2px';
    if(n.core){ n.baseColor='#e8e8e8'; n.baseGlow='0 0 16px rgba(93,242,154,.55)'; }
    else { n.baseColor=(n.status==='done'?'#5df29a':'#e2564d'); n.baseGlow='0 0 10px '+n.baseColor; }
    ring.style.borderColor=n.baseColor; ring.style.boxShadow=n.baseGlow;
    ring.textContent=n.icon; ring.style.color='#e8e8e8';
    var lbl=document.createElement('div'); lbl.className='lbl'; lbl.textContent=n.label;
    d.appendChild(ring); d.appendChild(lbl); scene.appendChild(d);
    n.el=d; n.ring=ring; n.lbl=lbl;
    if(!n.core){
      var p = pById[n.id];
      d.setAttribute('role','link'); d.setAttribute('tabindex','0');
      d.setAttribute('aria-label', n.label+' — '+n.desc);
      var show=function(){ paused=true;
        preview.querySelector('.t').textContent=n.label;
        preview.querySelector('.d').textContent=n.desc;
        var st=preview.querySelector('.st2');
        st.innerHTML = p.stats.slice(0,2).map(function(s){
          return '<span><i>'+s[0]+'</i> '+s[1]+'</span>'; }).join('');
        var tg=preview.querySelector('.tg');
        tg.innerHTML = p.tags.slice(0,3).map(function(t){ return '<span>'+t+'</span>'; }).join('');
        var s=preview.querySelector('.s');
        s.textContent=(n.status==='done'?'● done':'● in progress')+' · last touched '+p.lastTouched;
        s.className='s'+(n.status==='wip'?' wip':'');
        preview.style.opacity=1; ring.style.borderWidth='3px'; };
      var hide=function(){ paused=false; preview.style.opacity=0; ring.style.borderWidth='2px'; };
      d.addEventListener('mouseenter',show); d.addEventListener('mouseleave',hide);
      d.addEventListener('focus',show); d.addEventListener('blur',hide);
      var open=function(){ nav('projects/'+n.file); };
      d.addEventListener('click',open);
      d.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(); } });
    }
  });

  /* --- mode state --- */
  var mode='graph';
  try{ var saved=sessionStorage.getItem('topo_mode'); if(saved==='orbit'||saved==='graph') mode=saved; }catch(e){}
  function applyModeChrome(){
    edges.forEach(function(e){ e.el.style.display = mode==='graph'?'':'none'; });
    bands.forEach(function(b){ b.ring.style.display = mode==='orbit'?'':'none'; b.lblEl.style.display = mode==='orbit'?'':'none'; });
    if(fx) fx.style.display = mode==='orbit' ? 'block' : 'none';
    document.querySelectorAll('.mode-toggle button').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-mode')===mode); });
    if(mode!=='graph') resetAlgo();
  }
  window.setTopoMode = function(m){
    if(m!=='graph' && m!=='orbit') return false;
    mode=m; try{ sessionStorage.setItem('topo_mode',m); }catch(e){}
    applyModeChrome(); if(reduce) render();
    return true;
  };
  document.querySelectorAll('.mode-toggle button').forEach(function(b){
    b.addEventListener('click', function(){ window.setTopoMode(b.getAttribute('data-mode')); });
  });

  /* --- algorithm engine: bfs / dfs / dijkstra over the plain graph above.
     At rest the graph is undirected; running an algorithm is what makes it
     directed — arrows and weights appear only on edges the traversal
     actually crosses, in the direction it crossed them. --- */
  var algoSet = $('#algo-set'), algoReadout = $('#algo-readout');
  var algoTimer=null, algoName=null;
  function setRing(n, color, glow, style, bg){
    n.ring.style.borderColor=color; n.ring.style.boxShadow=glow;
    n.ring.style.borderStyle=style||'solid'; n.ring.style.background=bg||'';
  }
  function resetAlgo(){
    if(algoTimer){ clearInterval(algoTimer); algoTimer=null; }
    algoName=null; paused=false;
    scene.classList.remove('directed');
    nodes.forEach(function(n){ setRing(n, n.baseColor, n.baseGlow, 'solid', ''); });
    edges.forEach(function(e){ e.el.classList.remove('walked'); });
    if(algoReadout) algoReadout.textContent='';
    if(algoSet){ algoSet.classList.remove('on'); algoSet.innerHTML=''; }
    document.querySelectorAll('.algo-bar button').forEach(function(b){ b.classList.remove('active'); });
  }
  function stepperFor(name){
    if(name==='bfs'){
      var q=[{id:'you',via:null}], seen={};
      return function(){
        while(q.length){
          var cur=q.shift(); if(seen[cur.id]) continue; seen[cur.id]=true;
          adj[cur.id].forEach(function(nb){ if(!seen[nb.to]) q.push({id:nb.to,via:nb.edge}); });
          return {id:cur.id, via:cur.via, frontierLabel:'queue', frontier:q.map(function(x){return x.id;})};
        }
        return null;
      };
    }
    if(name==='dfs'){
      var st=[{id:'you',via:null}], seenD={};
      return function(){
        while(st.length){
          var cur=st.pop(); if(seenD[cur.id]) continue; seenD[cur.id]=true;
          var kids=adj[cur.id].filter(function(nb){return !seenD[nb.to];});
          for(var i=kids.length-1;i>=0;i--) st.push({id:kids[i].to,via:kids[i].edge});
          return {id:cur.id, via:cur.via, frontierLabel:'stack', frontier:st.map(function(x){return x.id;})};
        }
        return null;
      };
    }
    // dijkstra
    var dist={you:0}, seenX={}, pq=[{id:'you',via:null,d:0}];
    return function(){
      while(pq.length){
        pq.sort(function(a,b){return a.d-b.d;});
        var cur=pq.shift(); if(seenX[cur.id]) continue; seenX[cur.id]=true;
        adj[cur.id].forEach(function(nb){
          var nd=cur.d+nb.edge.w;
          if(dist[nb.to]===undefined || nd<dist[nb.to]){ dist[nb.to]=nd; pq.push({id:nb.to,via:nb.edge,d:nd}); }
        });
        var distSnap={}; Object.keys(dist).forEach(function(k){ if(seenX[k]||k===cur.id) distSnap[k]=dist[k]; });
        return {id:cur.id, via:cur.via, d:cur.d, frontierLabel:'pq',
          frontier:pq.map(function(x){return x.id+'(d='+x.d+')';}), dist:distSnap};
      }
      return null;
    };
  }
  function algoSetAppendVisited(n){
    var row = algoSet.querySelector('.row.visited');
    if(!row){
      row=document.createElement('div'); row.className='row visited';
      row.innerHTML='<span class="k">visited</span>{ <span class="items"></span> }';
      algoSet.insertBefore(row, algoSet.firstChild);
    }
    var items = row.querySelector('.items');
    var span=document.createElement('span');
    span.className='item'+(n.status?(' '+(n.status==='done'?'done':'wip')):'');
    span.textContent=(items.querySelectorAll('.item').length? ', ':'')+n.label;
    items.appendChild(span);
    requestAnimationFrame(function(){ span.classList.add('in'); });
  }
  function algoSetSetLine(cls, html){
    var row = algoSet.querySelector('.row.'+cls);
    if(!row){ row=document.createElement('div'); row.className='row '+cls; algoSet.appendChild(row); }
    row.innerHTML = html;
  }
  function runTopoAlgo(name){
    if(name==='reset'){ resetAlgo(); return true; }
    if(['bfs','dfs','dijkstra'].indexOf(name)===-1) return false;
    resetAlgo();
    if(mode!=='graph') window.setTopoMode('graph');
    algoName=name; paused=true; scene.classList.add('directed');
    algoSet.classList.add('on');
    algoSet.innerHTML='<div class="row visited"><span class="k">visited</span>{ <span class="items"></span> }</div>';
    document.querySelectorAll('.algo-bar button').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-algo')===name); });
    var step=stepperFor(name), n=0, total=nodes.length, visitedIds={}, prevNode=null;
    var s = step();
    algoTimer = setInterval(function(){
      if(!s){ clearInterval(algoTimer); algoTimer=null;
        if(prevNode) setRing(prevNode, prevNode.baseColor, prevNode.baseGlow, 'solid', 'rgba(93,242,154,.1)');
        if(algoReadout) algoReadout.textContent=name+' · done · visited '+n+'/'+total;
        return; }
      var node=byId[s.id]; n++; visitedIds[node.id]=true;
      if(prevNode) setRing(prevNode, prevNode.baseColor, prevNode.baseGlow, 'solid', 'rgba(93,242,154,.1)');
      setRing(node, '#e8e8e8', '0 0 14px rgba(255,255,255,.85)', 'solid', 'rgba(255,255,255,.1)');
      prevNode=node;
      algoSetAppendVisited(node);
      if(s.via){ s.via.el.classList.add('walked'); }
      // frontier ring highlight (amber dashed) for anything still queued/stacked/pq'd
      nodes.forEach(function(nn){
        if(nn.id===node.id || visitedIds[nn.id]) return;
        var inFrontier = s.frontier.some(function(f){ return (typeof f==='string' ? f.split('(')[0] : f)===nn.id; });
        if(inFrontier) setRing(nn, '#e8b13c', '0 0 8px rgba(232,177,60,.55)', 'dashed', '');
      });
      algoSetSetLine('frontier', '<span class="k">'+s.frontierLabel+'</span>[ '+s.frontier.join(', ')+' ]');
      if(s.dist) algoSetSetLine('dist', '<span class="k">dist</span>{ '+
        Object.keys(s.dist).map(function(k){return k+':'+s.dist[k];}).join(', ')+' }');
      if(algoReadout) algoReadout.textContent=name+' · step '+n+'/'+total;
      termWrite('visit <span class="ok">'+node.label+'</span>'+(s.d!==undefined?' (d='+s.d+')':''), 'dim');
      s = step();
    }, 450);
    return true;
  }
  window.runTopoAlgo = runTopoAlgo;
  document.querySelectorAll('.algo-bar button').forEach(function(b){
    b.addEventListener('click', function(){ runTopoAlgo(b.getAttribute('data-algo')); });
  });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && algoName) resetAlgo(); });

  /* --- rendering --- */
  var clock = reduce ? 2100 : 0, last = (window.performance||Date).now(), dt=16;
  function renderGraph(){
    var W=scene.clientWidth||900, H=scene.clientHeight||460, cx=W/2, cy=H/2;
    var k=Math.min(2, Math.max(1, Math.min(W,H)/480));
    var angle = clock*0.000227;
    nodes.forEach(function(n){
      var nx=n.x*k, ny=n.y*k;
      var x=nx*Math.cos(angle), z=baseZ+(-nx*Math.sin(angle)), s=focal/z;
      n._sx=cx+x*s; n._sy=cy+ny*s; n._s=s;
      placeNode(n, Math.max(20,(n.r*2)*s), Math.min(1,s*1.25), Math.round(s*100), s);
    });
    edges.forEach(function(e){
      var a=e.a,b=e.b, dx=b._sx-a._sx, dy=b._sy-a._sy, full=Math.hypot(dx,dy)||1;
      var ra=(a.r+6)*a._s, rb=(b.r+9)*b._s, ux=dx/full, uy=dy/full;
      e.el.style.left=(a._sx+ux*ra)+'px'; e.el.style.top=(a._sy+uy*ra)+'px';
      e.el.style.width=Math.max(0,full-ra-rb)+'px';
      e.el.style.transform='rotate('+Math.atan2(dy,dx)*180/Math.PI+'deg)';
      e.el.style.opacity=Math.min(a.el.style.opacity,b.el.style.opacity)*(e.chain?.9:.7);
      e.wEl.style.left=((a._sx+b._sx)/2)+'px'; e.wEl.style.top=((a._sy+b._sy)/2)+'px';
    });
  }
  function renderOrbit(){
    var W=scene.clientWidth||900, H=scene.clientHeight||460, cx=W/2, cy=H/2;
    var unit=orbitUnit(W,H);
    var you=byId.you; you._sx=cx; you._sy=cy;
    placeNode(you, you.r*2*1.15, 1, 60, 1.05);
    bands.forEach(function(b){
      var rx=unit*b.rf, ry=rx*0.52;
      b.ring.style.width=(2*rx)+'px'; b.ring.style.height=(2*ry)+'px';
      b.ring.style.left=(cx-rx)+'px'; b.ring.style.top=(cy-ry)+'px';
      b.lblEl.style.left=(cx+rx+4)+'px'; b.lblEl.style.top=cy+'px';
      b.items.forEach(function(m){
        var n=byId[m.id];
        var ang=m.phase + clock*m.speed;
        var depth=(Math.sin(ang)+1)/2;      // 0 back .. 1 front
        var s=0.82+0.30*depth;
        n._sx=cx+rx*Math.cos(ang); n._sy=cy+ry*Math.sin(ang);
        placeNode(n, (n.r*2)*s, 0.5+0.5*depth, 10+Math.round(depth*40), s);
      });
    });
    updateShip(); updateArena(); drawFX();
  }
  function placeNode(n, size, op, zi, s){
    n.el.style.left=n._sx+'px'; n.el.style.top=n._sy+'px';
    n.ring.style.width=size+'px'; n.ring.style.height=size+'px';
    n.ring.style.fontSize=Math.round(size*.45)+'px';
    n.el.style.opacity=op; n.el.style.zIndex=zi;
    n.lbl.style.top=(size/2+7)+'px';
    n.lbl.style.fontSize=Math.max(9,Math.round(11.5*s))+'px';
  }
  function render(){ if(mode==='graph') renderGraph(); else renderOrbit(); }

  applyModeChrome();
  resizeFx();
  window.addEventListener('resize', function(){ resizeFx(); render(); });
  if(reduce){ render(); }
  else (function frame(now){
    now = now||(window.performance||Date).now();
    dt=now-last; last=now;
    if(!paused) clock += dt;
    render();
    requestAnimationFrame(frame);
  })();
}

/* ---------------- title card (index.html) ---------------- */
function initTitleCard(){
  if(PAGE!=='title') return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var el=$('#typed');
  if(el){
    var word='ENGINEER', i=0;
    if(reduce) el.textContent=word;
    else (function t(){ if(i<=word.length){ el.textContent=word.slice(0,i++); setTimeout(t,90);} })();
  }
  document.querySelectorAll('[data-count-stat]').forEach(function(e){
    var path = e.getAttribute('data-count-stat').split('.');
    var v = STATS; for(var i=0;i<path.length;i++){ v = v && v[path[i]]; }
    if(!v) return;
    var target = parseInt(String(v).replace(/[^0-9]/g,''),10) || 0;
    var suffix = String(v).replace(/^[0-9,\.]+/,'');
    if(reduce){ e.textContent = target.toLocaleString()+suffix; return; }
    var cur=0, step=Math.ceil(target/50);
    var iv=setInterval(function(){ cur=Math.min(target,cur+step);
      e.textContent=cur.toLocaleString()+suffix; if(cur>=target) clearInterval(iv); },24);
  });
  function enter(){ nav('system.html'); }
  var btn = $('#enter-btn');
  if(btn) btn.addEventListener('click', function(e){ e.preventDefault(); enter(); });
  document.addEventListener('keydown', function(e){
    if(e.key==='Enter' && document.activeElement!==$('#resume-btn')){ enter(); }
  });
}

document.addEventListener('DOMContentLoaded', function(){
  deriveTotals();
  mountChrome();
  buildTree(); initDock(); initSidebar();
  buildGrid(); buildStatusLine(); buildParticles(); buildGraph();
  injectStats(); markDeadLinks(); renderProjectMeta();
  initTitleCard();
});
