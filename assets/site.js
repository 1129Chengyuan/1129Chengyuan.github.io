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

  { id:'raftkv', name:'RaftKV', file:'raftkv.html', icon:'⬡', status:'wip',
    cat:'distributed kv',
    desc:'Replicated key-value store built on the Raft consensus protocol.',
    stats:[['UPTIME','—'],['STATUS','building']], pos:{x:160,y:70}, gh:null,
    started:'2026-06', lastTouched:'2026-07-05', loc:540,
    tags:['Go','Raft','gRPC'],
    roadmap:'next: leader election + heartbeat, then log replication and a snapshotting path' },

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
  var openDockHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--term')) || 180;
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
    if(e.target.closest('#dock-min') || e.target.closest('.quick')) return;
    if(dock.classList.contains('min')){ expandDock(); return; }
    if(input) input.focus();
  });

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
   'graph' (hub-and-spoke, rotating) and 'orbit' (solar-system). */
function buildGraph(){
  var scene = $('#scene'); if(!scene) return;
  var preview = $('#topo-preview');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var focal=430, baseZ=390, paused=false;
  var pById={}; PROJECTS.forEach(function(p){ pById[p.id]=p; });
  var nodes = [{id:'you',label:'you',icon:'>',x:0,y:0,core:true,r:18}].concat(
    PROJECTS.map(function(p){ return {id:p.id,label:p.name,icon:p.icon,x:p.pos.x,y:p.pos.y,
      status:p.status,r:p.real?15:11,desc:p.desc,file:p.file}; }));
  var byId={}; nodes.forEach(function(n){byId[n.id]=n;});
  var chain = PROJECTS.filter(function(p){return p.chain!==undefined;})
                      .sort(function(a,b){return a.chain-b.chain;});
  var standalone = PROJECTS.filter(function(p){return p.chain===undefined;});

  /* --- graph-mode edges --- */
  var edges=[];
  for(var i=0;i<chain.length-1;i++) edges.push({a:byId[chain[i].id],b:byId[chain[i+1].id],chain:true});
  edges.push({a:byId.you,b:byId[chain[0].id]});
  standalone.forEach(function(p){ edges.push({a:byId.you,b:byId[p.id]}); });
  edges.forEach(function(e){
    var d=document.createElement('div');
    d.className='tedge '+(e.chain?'chain':'hub');
    if(e.chain){ var c=document.createElement('span'); c.className='arrowcap'; d.appendChild(c); }
    scene.appendChild(d); e.el=d;
  });

  /* --- orbit-mode rings + assignments --- */
  var orbits=[];
  orbits.push({ rf:0.44, speed:0.00020, members:chain.map(function(p,i){
    return { id:p.id, phase:i*(2*Math.PI/chain.length) }; }) });
  standalone.forEach(function(p,i){
    orbits.push({ rf:0.68+i*0.24, speed:(i%2?-1:1)*0.00015,
      members:[{ id:p.id, phase:i*1.9+0.6 }] });
  });
  orbits.forEach(function(o){
    var r=document.createElement('div'); r.className='orbit-ring'; scene.appendChild(r); o.ring=r;
  });

  /* --- nodes (shared across modes) --- */
  nodes.forEach(function(n){
    var d=document.createElement('div'); d.className='tnode'+(n.core?' core':' hit');
    var ring=document.createElement('div'); ring.className='ring';
    if(n.core){ ring.style.border='2px solid #e8e8e8'; ring.style.boxShadow='0 0 16px rgba(93,242,154,.55)'; }
    else { var col=(n.status==='done'?'#5df29a':'#e2564d'); ring.style.border='2px solid '+col; ring.style.boxShadow='0 0 10px '+col; }
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
    orbits.forEach(function(o){ o.ring.style.display = mode==='orbit'?'':'none'; });
    document.querySelectorAll('.mode-toggle button').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-mode')===mode); });
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

  /* --- rendering --- */
  var clock = reduce ? 2100 : 0, last = (window.performance||Date).now();
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
    });
  }
  function renderOrbit(){
    var W=scene.clientWidth||900, H=scene.clientHeight||460, cx=W/2, cy=H/2;
    var minR=Math.min(W,H)/2;
    // hub at center, static, slightly larger
    var you=byId.you; you._sx=cx; you._sy=cy;
    placeNode(you, you.r*2*1.15, 1, 60, 1.05);
    orbits.forEach(function(o){
      var rx=minR*o.rf, ry=rx*0.56;
      o.ring.style.width=(2*rx)+'px'; o.ring.style.height=(2*ry)+'px';
      o.ring.style.left=(cx-rx)+'px'; o.ring.style.top=(cy-ry)+'px';
      o.members.forEach(function(m){
        var n=byId[m.id];
        var ang=m.phase + clock*o.speed;
        var depth=(Math.sin(ang)+1)/2;      // 0 back .. 1 front
        var s=0.82+0.30*depth;
        n._sx=cx+rx*Math.cos(ang); n._sy=cy+ry*Math.sin(ang);
        placeNode(n, (n.r*2)*s, 0.5+0.5*depth, 10+Math.round(depth*40), s);
      });
    });
  }
  function placeNode(n, size, op, zi, s){
    n.el.style.left=n._sx+'px'; n.el.style.top=n._sy+'px';
    n.ring.style.width=size+'px'; n.ring.style.height=size+'px';
    n.ring.style.fontSize=Math.round(size*.45)+'px';
    n.el.style.opacity=op; n.el.style.zIndex=zi;
    n.lbl.style.fontSize=Math.max(9,Math.round(11.5*s))+'px';
  }
  function render(){ if(mode==='graph') renderGraph(); else renderOrbit(); }

  applyModeChrome();
  window.addEventListener('resize', render);
  if(reduce){ render(); }
  else (function frame(now){
    now = now||(window.performance||Date).now();
    var dt=now-last; last=now;
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
