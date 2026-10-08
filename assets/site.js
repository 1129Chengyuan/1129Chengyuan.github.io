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
   EDUCATION: the About page's education block.
   ============================================================ */
var STATS = {
  /* totals is filled in by deriveTotals() — do not edit by hand */
  totals: {},
  smalldb: {
    writes:   '52,874/s',
    latency:  '18.91µs',
    bloom:    '174→15,515/s',
    speedup:  '89x',
    recovery: '<30 ms'
  },
  gfs: {
    savings: '$50K+/yr',
    scan:    '97.8%'
  },
  kalshi: {
    trades:  '1M+/day',
    markets: '175K+'
  },
  mpc: {
    sims:  '120→4,000+',
    scale: '~33x'
  }
};

/* Order matters: it is the case-study grid order and the prev/next order. */
var PROJECTS = [
  /* company work: gh stays null, never link it */
  { id:'dataform-slots-optimization', name:'BigQuery Cost Optimizer', file:'dataform-slots.html', status:'done',
    cat:'cloud cost automation · Python on Google Cloud',
    desc:'An automated Google Cloud service that checks what every scheduled BigQuery job costs, picks the cheaper billing mode for each table, and opens a pull request to switch it. Saves $50K+ a year.',
    stats:[['SAVINGS',STATS.gfs.savings],['REVIEW','manual → automated']], pos:{x:80,y:85}, gh:null,
    started:'2026-05',
    tags:['BigQuery','Cloud Run','Cloud Scheduler','Terraform'],
    skills:['Python','SQL','GCP','Terraform','REST APIs','Git'],
    related:[['gfs','Built at']],
    roadmap:'require slots to beat on-demand by a configurable margin, so a table never flips between billing modes over pennies' },

  { id:'smalldb', name:'SmallDB', file:'smalldb.html', status:'done',
    cat:'key-value database · C++',
    desc:'A key-value database built from scratch in C++, modeled after RocksDB. It stores data durably on disk and recovers from a crash in under 30 ms.',
    stats:[['WRITES',STATS.smalldb.writes],['READS',STATS.smalldb.speedup+' faster']], pos:{x:15,y:-100},
    gh:'https://github.com/1129Chengyuan/SmallDB',
    started:'2025-08',
    tags:['C++20','LSM-tree','WAL','bloom filter'],
    skills:['C++','LSM-Trees','Concurrency','Performance Optimization'],
    roadmap:'benchmark against RocksDB and SQLite on the same workload so the numbers have a baseline, then leveled compaction to cut write amplification' },

  /* private repo: gh stays null, never link it */
  { id:'predictmarket', name:'Kalshi Market Pipeline', file:'predictmarket.html', status:'wip',
    cat:'data pipeline & lakehouse · Python',
    desc:'A pipeline that captures every trade on Kalshi’s prediction markets (1M+ a day) and builds a cloud lakehouse for checking how well market prices predict real outcomes.',
    stats:[['TRADES',STATS.kalshi.trades],['MARKETS',STATS.kalshi.markets]], pos:{x:-120,y:75}, gh:null,
    started:'2026-08',
    tags:['asyncio','AWS S3','Databricks','Airflow'],
    skills:['Python','Async I/O','REST APIs','ETL Pipelines','AWS','PySpark','Databricks','Airflow','Data Modeling','CI/CD'],
    related:[['smalldb','Evaluated']],
    roadmap:'add data-quality checks and tests to every Airflow task, then build the calibration tables out to every settled market' },

  { id:'hector-mpc', name:'Bipedal Robot Control on GPU', file:'hector-mpc.html', status:'done',
    cat:'robotics simulation · C++ → PyTorch',
    desc:'Moved a bipedal robot’s control software from C++ to PyTorch so it runs in batches on a GPU, scaling from 120 to 4,000+ simultaneous simulations.',
    stats:[['SIMULATIONS',STATS.mpc.sims],['SCALE',STATS.mpc.scale]], pos:{x:-160,y:60}, gh:null,
    started:'2024-12',
    tags:['C++','PyTorch','GPU'],
    skills:['C++','Python','PyTorch','Performance Optimization'],
    related:[['lidar','Built at']],
    roadmap:'profile the batched controller at larger batch sizes to find where GPU scaling stops' },

  { id:'portfolio', name:'This Site', file:'portfolio.html', status:'done',
    cat:'portfolio · JavaScript + three.js',
    desc:'An interactive 3D map of my roles, projects, and skills and how they connect, with a short case study for each project. Plain HTML, CSS, and JavaScript, no build step.',
    stats:[['PAGES','8'],['STATUS','deployed']], pos:{x:165,y:-10},
    gh:'https://github.com/1129Chengyuan/1129Chengyuan.github.io',
    started:'2026-04',
    tags:['HTML','CSS','JavaScript','GitHub Pages'],
    skills:['JavaScript','Git'],
    roadmap:'keep every new project entry data-driven instead of hand-wiring another page' }
];

/* ROLES: jobs and positions, from the resume. `skills` names entries in SKILLS. */
var ROLES = [
  { id:'gfs', title:'Data Engineer Intern', team:'Data Systems', org:'Gordon Food Service',
    period:'May 2026 – Aug 2026', place:'Atlanta, GA',
    bullets:[
      'Built an automated Google Cloud service that analyzes BigQuery usage and opens pull requests moving each table to its cheaper billing mode, saving $50,000+ per year.',
      'Migrated a 7 TB weekly full-refresh table to incremental merges, cutting data scanned by 97.8% (7 TB to 150 GB) and eliminating timeouts.',
      'Built an asynchronous pipeline that processes 3 TB of BigQuery audit logs across 4,000+ jobs, with batch retries and error monitoring.'
    ],
    skills:['Python','SQL','GCP','Terraform','Docker','Git','ETL Pipelines','Agile'] },

  { id:'gatech-ta', title:'Teaching Assistant', team:'CS 4400 Database Systems · CS 1331 Intro to OOP', org:'Georgia Tech',
    period:'Jan 2025 – Present', place:'Atlanta, GA',
    bullets:[
      'CS 4400 (Database Systems): support 450+ students on schema design, SQL, indexing (B+ trees, hash indexes), query optimization, and transaction isolation.',
      'CS 1331 (Intro to OOP): lead weekly labs for 220+ undergraduates on object-oriented design, code review, and test-driven development with JUnit.'
    ],
    skills:['SQL','Java','TDD','Data Modeling'] },

  { id:'astar', title:'Systems Research Intern', team:'Institute of High Performance Computing', org:'A*STAR',
    period:'May 2025 – Aug 2025', place:'Singapore',
    bullets:[
      'Built a Python benchmarking framework that measures inference throughput, memory use, and latency across 40+ transformer architectures.',
      'Analyzed multi-gigabyte GPU execution traces to isolate KV-cache memory bottlenecks; presented the findings to senior researchers and supported a research manuscript.'
    ],
    skills:['Python','Performance Optimization'] },

  { id:'lidar', title:'Undergrad Researcher', team:'Laboratory for Intelligent Decision and Autonomous Robots', org:'Georgia Tech LIDAR',
    period:'Dec 2024 – May 2025', place:'Atlanta, GA',
    bullets:[
      'Worked with PhD students on the HECTOR bipedal robot, converting its Model Predictive Control logic from C++ to PyTorch for batched GPU execution.',
      'Scaled simulations from 120 to 4,000+ simultaneous runs (about 33x).'
    ],
    skills:['C++','PyTorch'] }
];

/* SKILLS: the resume's skills, grouped as on the resume. Projects and roles
   point at these by name through their `skills` field. Only list what I can
   discuss in an interview. */
var SKILLS = [
  { group:'LANGUAGES', items:['Python','C++','Java','SQL','JavaScript','Bash'] },
  { group:'BACKEND & DATA', items:['REST APIs','Async I/O','ETL Pipelines','PySpark','Databricks','Airflow','Data Modeling'] },
  { group:'CLOUD & TOOLING', items:['GCP','AWS','Terraform','Docker','Linux','CI/CD','Git'] },
  { group:'SYSTEMS & PRACTICE', items:['LSM-Trees','Concurrency','Performance Optimization','PyTorch','TDD','Agile'] }
];

/* EDUCATION: the About page's education block. */
var EDUCATION = {
  school:'Georgia Institute of Technology', degree:'B.S. Computer Science', period:'Aug 2024 – May 2028 (expected)',
  gpa:'4.0 / 4.0 · Faculty Honors', threads:'Information Internetworks + Modeling & Simulation',
  courses:['Data Structures & Algorithms','Design & Analysis of Algorithms','Database Management Systems','Object-Oriented Programming','Machine Learning','Computer Modeling & Simulation','Probability & Statistics','Discrete Mathematics']
};

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

/* ---------------- education (about page) ---------------- */
function renderEducation(){
  var el = $('#education'); if(!el) return;
  var e = EDUCATION;
  el.innerHTML = '<div class="edu-school">'+e.school+'</div>'+
    '<div class="edu-line">'+e.degree+' · '+e.period+'</div>'+
    '<div class="edu-line"><b>GPA</b> '+e.gpa+'</div>'+
    '<div class="edu-line"><b>Threads</b> '+e.threads+'</div>'+
    '<div class="tags" style="margin-top:12px;">'+e.courses.map(function(c){ return '<span>'+c+'</span>'; }).join('')+'</div>';
}

/* ---------------- roles timeline (about page) ---------------- */
function renderRoles(){
  var el = $('#roles-list'); if(!el) return;
  el.innerHTML = ROLES.map(function(r){
    return '<li><div class="yr">'+r.period+'</div><div class="ev">'+r.title+'</div><div class="de">'+r.org+' · '+r.team+'</div>'+
      '<ul class="role-bullets">'+r.bullets.map(function(b){ return '<li>'+b+'</li>'; }).join('')+'</ul></li>';
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
    var next = p.roadmap.replace(/^next:\s*/,'');
    rm.innerHTML = '<span>'+next.charAt(0).toUpperCase()+next.slice(1)+'.</span>';
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
  buildGrid(); renderSkills(); renderRoles(); renderEducation();
  injectStats(); markDeadLinks(); renderProjectMeta();
});
