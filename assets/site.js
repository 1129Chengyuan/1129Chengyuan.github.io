/* ============================================================
   EDIT ME — one source of truth for the whole site.

   STATS    : every benchmark number shown anywhere. STATS.totals
              is COMPUTED from PROJECTS at load — never hand-edit it.
   PROJECTS : the ontology (home), the case-study grid, and each case
              study's roadmap/source button read this. Add a project
              here and it shows up everywhere. `related` holds true
              links to a project or a role, e.g. [['smalldb','Evaluated']]
              or [['gfs','Built at']]; `pos` places a project on the
              ontology slab if assets/ontology.js has no spot for it.
   ROLES    : jobs/positions (the ontology's purple objects).
   SKILLS   : resume skills; projects and roles list theirs in `skills`.
   ============================================================ */
var STATS = {
  /* totals is filled in by deriveTotals() — do not edit by hand */
  totals: {},
  smalldb: {
    writes:  '52,874/s',
    latency: '18.91µs',
    bloom:   '174→15,515/s',
    speedup: '89x',
    fp:      '1%'
  }
};

var PROJECTS = [
  { id:'smalldb', name:'SmallDB', file:'smalldb.html', status:'done',
    cat:'storage engine · C++20',
    desc:'LSM-tree storage engine from scratch: WAL, memtable, sparse-indexed SSTables, bloom filters, a concurrent block cache, background streaming compaction.',
    stats:[['WRITES',STATS.smalldb.writes],['LATENCY',STATS.smalldb.latency]], pos:{x:15,y:-100},
    gh:'https://github.com/1129Chengyuan/smalldb',
    started:'2025-08',
    tags:['C++20','WAL','bloom filter','k-way merge'],
    skills:['C++','LSM-Trees'],
    roadmap:'next: leveled compaction to cut write amplification, then block-level compression' },

  { id:'portfolio', name:'This Site', file:'portfolio.html', status:'done',
    cat:'portfolio · vanilla JS + three.js',
    desc:'This portfolio itself: a dependency-free, no-build site where one data file drives a 3D ontology of my roles, projects, and skills, plus every case study.',
    stats:[['PAGES','8'],['STATUS','deployed']], pos:{x:165,y:-10},
    gh:'https://github.com/1129Chengyuan/1129Chengyuan.github.io',
    started:'2026-07',
    tags:['HTML','CSS','JavaScript','GitHub Pages'],
    skills:['Git','AI Dev Tools'],
    roadmap:'next: keep every new project entry data-driven instead of hand-wiring another page' },

  /* private repo: gh stays null, never link it */
  { id:'predictmarket', name:'PredictMarketPipeline', file:'predictmarket.html', status:'wip',
    cat:'market-data ingestion · async Python',
    desc:'Async Python pipeline ingesting Kalshi prediction-market data into a date-partitioned Bronze layer: hand-rolled token-bucket rate limiter, centralized retries with backoff, RSA-PSS signed requests.',
    stats:[['LAYER','Bronze'],['STATUS','building']], pos:{x:-120,y:75}, gh:null,
    started:'2026-08',
    tags:['Python','asyncio','aiohttp','token bucket','medallion'],
    skills:['Python','Async I/O','REST APIs','CI/CD','AWS','Databricks'],
    related:[['smalldb','Evaluated']],
    roadmap:'next: run the backfills to completion, then a scheduler and the Silver/Gold layer on Databricks' },

  /* company work: gh stays null, never link it */
  { id:'dataform-slots-optimization', name:'Dataform Slots Optimization', file:'dataform-slots.html', status:'done',
    cat:'bigquery cost automation',
    desc:'Automated Dataform rewrite pipeline that routes queries between slot reservations and on-demand compute.',
    stats:[['SAVINGS','$50k+/yr'],['STATUS','deployed']], pos:{x:80,y:85}, gh:null,
    started:'2026-07',
    tags:['BigQuery','Dataform','Cloud Run'],
    skills:['GCP','SQL','REST APIs'],
    related:[['gfs','Built at']],
    roadmap:'next: keep tuning the rewrite heuristics and reservation routing rules' }
];

/* ROLES: jobs and positions, from the resume. `skills` names entries in SKILLS. */
var ROLES = [
  { id:'gfs', title:'Backend Software Engineer Intern', team:'Data Systems', org:'Gordon Food Service',
    period:'May 2026 – Aug 2026', place:'Atlanta, GA',
    bullets:[
      'Engineered an automated serverless data-cost management service using REST APIs and BigQuery slot allocation, securing $50,000+ in annual infrastructure savings.',
      'Refactored a 7 TB weekly analytical data engine with an incremental merge pipeline using deterministic key hashing, reducing data scan overhead by 97.8% (7 TB to 150 GB).',
      'Architected an asynchronous log-parsing pipeline processing 3 TB of execution traces across 4,000+ job configurations on Linux environments, eliminating execution latency and pipeline failures.'
    ],
    skills:['Python','SQL','REST APIs','GCP','Docker','Git','Agile/Scrum','Terraform'] },

  { id:'gatech-ta', title:'Teaching Assistant', team:'Database Systems & Object-Oriented Software', org:'Georgia Tech',
    period:'Jan 2025 – Present', place:'Atlanta, GA',
    bullets:[
      'CS 4400 (Database Systems): mentor 100+ students on PostgreSQL schema design, B+ tree indexing, ACID transaction isolation, and SQL query optimization for high-concurrency systems.',
      'CS 1331 (Introduction to OOP): lead labs for 220+ undergraduates, enforcing clean software architecture, object-oriented design patterns, REST API principles, and automated TDD (JUnit).'
    ],
    skills:['SQL','Java','TDD','REST APIs'] },

  { id:'astar', title:'Research Intern', team:'Distributed Data Performance', org:'A*STAR IHPC',
    period:'May 2025 – Aug 2025', place:'Singapore',
    bullets:[
      'Built an automated profiling framework to benchmark execution throughput, memory footprints, and compute latency across 40+ large-scale data system architectures.',
      'Engineered log-processing pipelines to analyze multi-gigabyte device execution traces, pinpointing memory bandwidth constraints and optimizing cache utilization.'
    ],
    skills:['Distributed Systems'] }
];

/* SKILLS: the resume's skills, grouped as on the resume. Projects and roles
   point at these by name through their `skills` field. */
var SKILLS = [
  { group:'LANGUAGES', items:['Python','SQL','C++','Java'] },
  { group:'DATA SYSTEMS', items:['Distributed Systems','LSM-Trees','Async I/O','REST APIs'] },
  { group:'CLOUD & INFRASTRUCTURE', items:['AWS','GCP','Databricks','Docker','Terraform'] },
  { group:'TOOLING & PRACTICE', items:['CI/CD','Git','TDD','Agile/Scrum','AI Dev Tools'] }
];

var R = window.SITE_ROOT || '';
var PAGE = window.SITE_PAGE || '';
var $ = function(s){ return document.querySelector(s); };

/* ---------------- derived totals ---------------- */
function deriveTotals(){
  var done = PROJECTS.filter(function(p){ return p.status==='done'; }).length;
  STATS.totals = {
    projects: PROJECTS.length,
    done: done,
    inProgress: PROJECTS.length - done
  };
}


/* ---------------- shared shell: a persistent header + footer ---------------- */
/* Injected into every page, home included, so navigation is identical
   everywhere and lives in exactly one place. Styles: assets/chrome.css. */
var NAV = [
  ['index.html', 'Home', 'home'],
  ['about.html', 'About', 'about']
];
function currentProject(){
  return PROJECTS.filter(function(p){ return p.id === PAGE || p.file === PAGE + '.html'; })[0];
}
function mountChrome(){
  var header = document.createElement('header');
  header.className = 'site-head' + (PAGE==='home' ? ' wide' : '');   // home's content runs wider
  header.innerHTML =
    '<div class="inner">'+
      '<a class="brand" href="'+R+'index.html">Cheng-Yuan Li</a>'+
      '<nav aria-label="Site">'+
        NAV.map(function(n){
          var cur = n[2]===PAGE;
          return '<a href="'+R+n[0]+'"'+(cur?' class="cur" aria-current="page"':'')+'>'+n[1]+'</a>';
        }).join('')+
        '<a class="pill-link" href="'+R+'assets/resume.pdf" target="_blank" rel="noopener">Resume</a>'+
      '</nav>'+
    '</div>';
  document.body.insertBefore(header, document.body.firstChild);

  var foot = document.createElement('footer');
  foot.className = 'site-foot' + (PAGE==='home' ? ' wide' : '');
  foot.innerHTML = '<span>Cheng-Yuan Li · Georgia Tech</span>'+
    '<span><a href="https://github.com/1129Chengyuan" target="_blank" rel="noopener">GitHub</a> · '+
    '<a href="https://www.linkedin.com/in/cheng-yuan-li/" target="_blank" rel="noopener">LinkedIn</a> · '+
    '<a href="mailto:chengyuan@gatech.edu">Email</a></span>';
  document.body.appendChild(foot);

  // case studies: a way back to the list, and to the neighbouring write-ups
  var p = currentProject(), main = $('main');
  if(p && main){
    var crumb = document.createElement('a');
    crumb.className = 'crumb'; crumb.href = R+'projects/index.html'; crumb.textContent = '← All case studies';
    main.insertBefore(crumb, main.firstChild);
    var i = PROJECTS.indexOf(p), prev = PROJECTS[i-1], next = PROJECTS[i+1];
    var pager = document.createElement('nav');
    pager.className = 'pager'; pager.setAttribute('aria-label','More case studies');
    pager.innerHTML =
      (prev ? '<a class="prev" href="'+R+'projects/'+prev.file+'"><small>← PREVIOUS</small>'+prev.name+'</a>' : '')+
      (next ? '<a class="next" href="'+R+'projects/'+next.file+'"><small>NEXT →</small>'+next.name+'</a>' : '');
    main.appendChild(pager);
  }
}

/* ---------------- project grid (projects/index only) ---------------- */
function buildGrid(){
  var g = $('#grid'); if(!g) return;
  var count = $('#proj-count');
  if(count) count.textContent = PROJECTS.length+' projects · '+STATS.totals.done+' shipped · '+STATS.totals.inProgress+' in progress';
  g.innerHTML = PROJECTS.map(function(p){
    var role = (p.related||[]).map(function(r){ return ROLES.filter(function(x){ return x.id===r[0]; })[0]; }).filter(Boolean)[0];
    return '<a class="card" href="'+R+'projects/'+p.file+'">'+
      '<div class="card-top"><span class="type-pill">project</span>'+
      '<span class="status '+(p.status==='done'?'done':'wip')+'"><span class="dot '+(p.status==='done'?'g':'r')+'"></span>'+
      (p.status==='done'?'shipped':'in progress')+'</span></div>'+
      '<h3>'+p.name+'</h3><div class="cat">'+p.cat+(role?' · built at '+role.org:'')+'</div><p>'+p.desc+'</p>'+
      '<div class="mini">'+p.stats.map(function(s){
        return '<div><div class="k">'+s[0]+'</div><div class="v">'+s[1]+'</div></div>';}).join('')+'</div>'+
      '<div class="tags">'+(p.skills||[]).map(function(t){ return '<span>'+t+'</span>'; }).join('')+'</div>'+
      '<div class="card-foot"><span>'+(p.gh?'source public':'source private')+'</span><span class="go">Read the case study →</span></div></a>';
  }).join('');
}

/* ---------------- skills, grouped as on the resume (about page) ---------------- */
function renderSkills(){
  var el = $('#skills-list'); if(!el) return;
  el.innerHTML = SKILLS.map(function(g){
    return '<div class="stack-group"><div class="gk">'+g.group+'</div><div class="tags">'+
      g.items.map(function(t){ return '<span>'+t+'</span>'; }).join('')+'</div></div>';
  }).join('');
}

/* ---------------- roles timeline (about page) ---------------- */
function renderRoles(){
  var el = $('#roles-list'); if(!el) return;
  el.innerHTML = ROLES.map(function(r){
    return '<li><div class="yr">'+r.period+'</div><div class="ev">'+r.title+'</div><div class="de">'+r.org+' · '+r.team+'</div></li>';
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
  var page = currentProject();
  var btn = $('#src-link');
  if(!btn) return;
  if(page && page.gh){
    btn.href = page.gh; btn.removeAttribute('aria-disabled');
  } else {
    btn.classList.add('disabled');
    btn.removeAttribute('href');
    btn.setAttribute('aria-disabled','true');
    btn.title = 'source not published';
    btn.textContent = 'source not published';
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
  var p = currentProject();
  if(!p) return;
  var rm = $('#p-roadmap');
  if(rm){
    rm.classList.add('roadmap');
    if(p.status!=='done') rm.classList.add('wip');
    var label = p.status==='done' ? 'What’s next' : 'Roadmap';
    rm.innerHTML = '<b>'+label+'</b> <span>'+p.roadmap.replace(/^next:\s*/,'')+'</span>';
  }
  var tl = $('#p-timeline');
  if(tl){
    tl.classList.add('timeline-strip');
    tl.innerHTML = '<span class="node">started '+p.started+'</span>'+
      '<span class="bar'+(p.status==='done'?'':' wip')+'"></span>'+
      '<span class="node">'+(p.status==='done'?'shipped':'in progress')+'</span>';
  }
}

document.addEventListener('DOMContentLoaded', function(){
  deriveTotals();
  mountChrome();
  buildGrid(); renderSkills(); renderRoles();
  injectStats(); markDeadLinks(); renderProjectMeta();
});
