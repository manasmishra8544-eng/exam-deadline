
(() => {
  'use strict';
  const KEY='examDeadlinePlanner.v3';
  const colors=['#6e83f4','#a080e8','#f0a15d','#43b99a','#e77e9b','#5badd5','#c0a04d'];
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const uid=()=>Math.random().toString(36).slice(2,10);
  const todayISO=()=>{const d=new Date();d.setHours(0,0,0,0);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const dateObj=s=>new Date(`${s}T12:00:00`);
  const fmt=(s,o={month:'short',day:'numeric'})=>dateObj(s).toLocaleDateString(undefined,o);
  const daysLeft=s=>Math.ceil((dateObj(s)-dateObj(todayISO()))/86400000);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fresh=()=>({subjects:[],exams:[],tasks:[],dark:false});
  let data;try{data=JSON.parse(localStorage.getItem(KEY))||fresh();}catch{data=fresh();}
  if(!Array.isArray(data.subjects)||!Array.isArray(data.exams)||!Array.isArray(data.tasks))data=fresh();
  let toastTimer, modalSaveFn=null;
  const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
  const topics=()=>data.subjects.flatMap(s=>s.topics.map(t=>({...t,subject:s.name,color:s.color,subjectId:s.id})));
  const completed=()=>topics().filter(t=>t.done).length;
  const pct=(n,total)=>total?Math.round(n/total*100):0;
  const upcoming=()=>data.exams.filter(e=>daysLeft(e.date)>=0).sort((a,b)=>a.date.localeCompare(b.date));
  function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2300);}
  function go(page){
    const target = document.getElementById(page);
    if(!target) return;

    $$('.page').forEach(p => p.classList.toggle('active', p.id === page));
    $$('[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));

    document.body.classList.toggle('landing-mode', page === 'home');

    const names = {
      home: 'Home',
      dashboard: 'Dashboard',
      syllabus: 'Syllabus',
      exams: 'Exams & Deadlines',
      analytics: 'Analytics',
      settings: 'Settings'
    };
    if($('#pageName')) $('#pageName').textContent = names[page] || 'Dashboard';
    if($('#sidebar')) $('#sidebar').classList.remove('open');

    render();
    window.scrollTo({top:0, behavior:'smooth'});
  }
    function renderLanding(){
    const exams = upcoming();
    const next = exams[0];
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if(el) el.textContent = value;
    };

    setText('landingCountdown', next ? daysLeft(next.date) : '--');
    setText('landingExamLabel', next ? next.name : 'No exam scheduled');
    setText('landingPercent', pct(completed(), topics().length) + '%');
    setText('landingTopics', `${completed()} / ${topics().length} topics`);
    setText('landingQuote', 'Small steps. Consistent progress.');

    const bar = document.getElementById('landingProgressBar');
    if(bar) bar.style.width = pct(completed(), topics().length) + '%';
  }
  function render(){
    document.body.classList.toggle('dark', !!data.dark);
    const themeIcon = data.dark ? '☀' : '☾';
    ['themeBtn','landingThemeBtn'].forEach(id => { const b = document.getElementById(id); if (b) b.textContent = themeIcon; });
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(!!data.dark));
    renderLanding();

    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const exams = upcoming();

    renderTasks(tasks.slice(0, 5));
    renderDeadlines(exams.slice(0, 3));
    renderOverview();
    renderSyllabus();
    renderExams(exams);
    renderAnalytics();
  }
function renderTasks(items){
    $('#taskList').innerHTML=items.length?items.map(t=>`<div class="task-row ${t.done?'done':''}"><input class="task-check" type="checkbox" data-task="${t.id}" ${t.done?'checked':''}><span class="task-text">${esc(t.text)}</span><span class="task-tag">${esc(t.tag||'Task')}</span><button class="delete-btn" data-delete-task="${t.id}" aria-label="Delete task">×</button></div>`).join(''):'<div class="empty">No tasks for today. Add one small goal to begin.</div>';
  }
  function renderDeadlines(items){
    $('#deadlineList').innerHTML=items.length?items.map(e=>{const d=daysLeft(e.date),dt=dateObj(e.date);return `<div class="deadline-row"><div class="date-tile"><b>${dt.getDate()}</b><small>${dt.toLocaleDateString(undefined,{month:'short'}).toUpperCase()}</small></div><div class="deadline-info"><b>${esc(e.name)}</b><small>${esc(e.subject||'Exam')} · ${d===0?'Today':d===1?'Tomorrow':d+' days left'}</small></div><span class="days-badge">${d===0?'Today':d+'d left'}</span></div>`}).join(''):'<div class="empty">No deadlines yet. Your upcoming exams will appear here.</div>';
  }
  function renderOverview(){
    $('#subjectOverview').innerHTML=data.subjects.length?data.subjects.slice(0,6).map(s=>{const n=s.topics.length,d=s.topics.filter(t=>t.done).length;return `<div class="subject-mini"><b><span class="subject-dot" style="background:${s.color}"></span>${esc(s.name)}</b><p>${d}/${n} topics complete</p><div class="bar"><span style="width:${pct(d,n)}%;background:${s.color}"></span></div></div>`}).join(''):'<div class="empty">Add a subject to see progress here.</div>';
  }
  function renderSyllabus(){
    const q=($('#search').value||'').trim().toLowerCase(),filtered=data.subjects.filter(s=>s.name.toLowerCase().includes(q)||s.topics.some(t=>t.name.toLowerCase().includes(q)));
    $('#topicSummary').textContent=`${topics().length} topics · ${completed()} completed`;$ ('#syllabusEmpty').classList.toggle('hidden',filtered.length>0);
    $('#subjectGrid').innerHTML=filtered.map(s=>{const n=s.topics.length,d=s.topics.filter(t=>t.done).length,p=pct(d,n),shown=s.topics.filter(t=>!q||s.name.toLowerCase().includes(q)||t.name.toLowerCase().includes(q));return `<article class="subject-card"><div class="subject-card-head"><span class="subject-dot" style="background:${s.color}"></span><div class="subject-card-title"><h3>${esc(s.name)}</h3><p>${n} topics · ${d} completed</p></div><div class="card-actions"><button class="tiny-btn" data-rename-subject="${s.id}" title="Rename">✎</button><button class="tiny-btn" data-delete-subject="${s.id}" title="Delete">×</button></div></div><div class="subject-progress"><div class="bar"><span style="width:${p}%;background:${s.color}"></span></div><small>${p}%</small></div><div class="topic-list">${shown.map(t=>`<div class="topic-row ${t.done?'done':''}"><input type="checkbox" data-topic="${s.id}|${t.id}" ${t.done?'checked':''}><span>${esc(t.name)}</span><button class="delete-btn" data-delete-topic="${s.id}|${t.id}">×</button></div>`).join('')}</div><form class="topic-add" data-add-topic="${s.id}"><input name="topic" placeholder="Add a topic…" required><button>＋</button></form></article>`}).join('');
  }
  function renderExams(items){
    const e=items[0];$('#nextExamTitle').textContent=e?e.name:'Your next exam goes here';$('#nextExamDate').textContent=e?`${e.subject||'Exam'} · ${fmt(e.date,{weekday:'long',month:'long',day:'numeric',year:'numeric'})}`:'Add an exam date to start a countdown.';$('#countdown').textContent=e?daysLeft(e.date):'—';
    $('#examList').innerHTML=items.length?items.map(e=>{const d=dateObj(e.date),left=daysLeft(e.date);return `<div class="exam-item"><div class="date-tile"><b>${d.getDate()}</b><small>${d.toLocaleDateString(undefined,{month:'short'}).toUpperCase()}</small></div><div class="exam-info"><b>${esc(e.name)}</b><p>${esc(e.subject||'General')} · ${fmt(e.date,{weekday:'short',month:'long',day:'numeric',year:'numeric'})}</p></div><div class="exam-actions"><span class="days-badge">${left===0?'Today':left+' days'}</span><button class="tiny-btn" data-edit-exam="${e.id}">✎</button><button class="tiny-btn" data-delete-exam="${e.id}">×</button></div></div>`}).join(''):'<div class="empty">No upcoming exams. Add a date and make a plan.</div>';
  }
  function renderAnalytics(){
    const ts=topics(),done=completed(),rate=pct(done,ts.length);$('#totalTopics').textContent=ts.length;$('#completedTopics').textContent=done;$('#completionRate').textContent=rate+'%';
    $('#analyticsSubjects').innerHTML=data.subjects.length?data.subjects.map(s=>{const n=s.topics.length,d=s.topics.filter(t=>t.done).length,p=pct(d,n);return `<div class="analytics-row"><b>${esc(s.name)}</b><div class="bar"><span style="width:${p}%;background:${s.color}"></span></div><small>${p}%</small></div>`}).join(''):'<div class="empty">Add subjects to see your progress.</div>';
    $('#insightText').textContent=!ts.length?'Add subjects and topics to see your progress here.':rate===100?'Amazing — every listed topic is complete! Add your next learning goal.':`${done} of ${ts.length} topics complete. Your next win is one topic away.`;
  }
  function field(label,name,type='text',value=''){return `<div class="field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" required></div>`;}
  function selectField(label,name,options,value=''){return `<div class="field"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}"><option value="">None / general</option>${options.map(x=>`<option ${x===value?'selected':''} value="${esc(x)}">${esc(x)}</option>`).join('')}</select></div>`;}
  function openModal(title,fields,fn){
    $('#modalTitle').textContent=title;$('#modalFields').innerHTML=fields;modalSaveFn=fn;$('#modal').showModal();setTimeout(()=>$('#modalFields input')?.focus(),30);
  }
  function addTask(){openModal('Add a task',field('What do you want to do?','text')+selectField('Task type','tag',['Revision','Practice','Reading','Homework','Focus','Other']),fd=>{const text=String(fd.get('text')||'').trim();if(!text)return 'Enter a task name.';data.tasks.push({id:uid(),text,tag:fd.get('tag')||'Task',done:false,date:todayISO()});return 'Task added.';});}
  function addSubject(id){
    const s=id?data.subjects.find(x=>x.id===id):null;
    openModal(s?'Rename subject':'Add a subject',field('Subject name','name','text',s?.name||''),fd=>{const name=String(fd.get('name')||'').trim();if(!name)return 'Enter a subject name.';if(data.subjects.some(x=>x.name.toLowerCase()===name.toLowerCase()&&x.id!==s?.id))return 'That subject already exists.';if(s)s.name=name;else data.subjects.push({id:uid(),name,color:colors[data.subjects.length%colors.length],topics:[]});return s?'Subject renamed.':'Subject added.';});
  }
  function addExam(id){
    const e=id?data.exams.find(x=>x.id===id):null;
    openModal(e?'Edit exam':'Add an exam or deadline',field('Exam or deadline name','name','text',e?.name||'')+selectField('Subject','subject',data.subjects.map(s=>s.name),e?.subject||'')+field('Date','date','date',e?.date||todayISO()),fd=>{const name=String(fd.get('name')||'').trim(),date=String(fd.get('date')||'');if(!name||!date)return 'Enter an exam name and date.';const item={id:e?.id||uid(),name,subject:fd.get('subject')||'',date};if(e)Object.assign(e,item);else data.exams.push(item);return e?'Exam updated.':'Exam added.';});
  }
  $('#modalForm').addEventListener('submit',e=>{e.preventDefault();if(!modalSaveFn)return;const result=modalSaveFn(new FormData(e.currentTarget));if(result){toast(result);if(/Enter |exists/.test(result))return;}$('#modal').close();render();});
  function closeModal(){$('#modal').close();}$('#closeModal').addEventListener('click',closeModal);$('#cancelModal').addEventListener('click',closeModal);
  document.addEventListener('click',e=>{
    const pg=e.target.closest('[data-page]');if(pg){e.preventDefault();go(pg.dataset.page);return;}
    const action=e.target.closest('[data-action]')?.dataset.action;if(action==='task')addTask();if(action==='subject')addSubject();if(action==='exam')addExam();if(action==='export')exportBackup();
    if(action==='reset'&&confirm('Reset all planner data? Export a backup first if you need to keep it.')){data=fresh();render();toast('Planner reset.');}
    const ren=e.target.closest('[data-rename-subject]');if(ren)addSubject(ren.dataset.renameSubject);
    const ds=e.target.closest('[data-delete-subject]');if(ds){const s=data.subjects.find(x=>x.id===ds.dataset.deleteSubject);if(s&&confirm(`Delete ${s.name} and all its topics?`)){data.subjects=data.subjects.filter(x=>x.id!==s.id);render();toast('Subject deleted.');}}
    const dt=e.target.closest('[data-delete-topic]');if(dt){const [sid,tid]=dt.dataset.deleteTopic.split('|'),s=data.subjects.find(x=>x.id===sid);if(s){s.topics=s.topics.filter(t=>t.id!==tid);render();}}
    const task=e.target.closest('[data-delete-task]');if(task){data.tasks=data.tasks.filter(t=>t.id!==task.dataset.deleteTask);render();toast('Task removed.');}
    const exam=e.target.closest('[data-delete-exam]');if(exam){data.exams=data.exams.filter(x=>x.id!==exam.dataset.deleteExam);render();toast('Exam removed.');}
    const edit=e.target.closest('[data-edit-exam]');if(edit)addExam(edit.dataset.editExam);
  });
  document.addEventListener('change',e=>{
    if(e.target.matches('[data-task]')){const t=data.tasks.find(x=>x.id===e.target.dataset.task);if(t)t.done=e.target.checked;render();}
    if(e.target.matches('[data-topic]')){const [sid,tid]=e.target.dataset.topic.split('|'),s=data.subjects.find(x=>x.id===sid),t=s?.topics.find(x=>x.id===tid);if(t)t.done=e.target.checked;render();}
    if(e.target.id==='importFile'){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const v=JSON.parse(r.result);if(!Array.isArray(v.subjects)||!Array.isArray(v.exams)||!Array.isArray(v.tasks))throw Error();data=v;render();toast('Backup imported.');}catch{toast('Invalid backup file.');}e.target.value='';};r.readAsText(f);}
  });
  document.addEventListener('submit',e=>{const form=e.target.closest('[data-add-topic]');if(!form)return;e.preventDefault();const name=new FormData(form).get('topic')?.trim();if(!name)return;const s=data.subjects.find(x=>x.id===form.dataset.addTopic);if(s){s.topics.push({id:uid(),name,done:false});render();toast('Topic added.');}});
  $('#search').addEventListener('input',renderSyllabus);
  function toggleTheme(){data.dark=!data.dark;save();render();}$('#themeBtn').addEventListener('click',toggleTheme);$('#landingThemeBtn')?.addEventListener('click',toggleTheme);$('#themeToggle').addEventListener('click',toggleTheme);$('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  function exportBackup(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='exam-deadline-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup downloaded.');}
  // PA2_SYLLABUS_2026_SEEDED
  if (!data.pa2Syllabus2026Added) {
    const syllabus = [
      {
        id: "pa2-2026-economics",
        name: "Economics",
        topics: [
          "Sectors of economy",
          "Meaning and types of sectors of economy",
          "Role of primary, secondary and tertiary sector in Indian economy",
          "Organised and unorganised sector",
          "Meaning and importance",
          "Role of the unorganised and organised sector in Indian economy"
        ]
      },
      {
        id: "pa2-2026-physics",
        name: "Science - Physics",
        topics: [
          "How How Forces Affect Motion (Force and Laws of Motion)",
          "Work, Energy, and Simple Machines"
        ]
      },
      {
        id: "pa2-2026-biology",
        name: "Biology",
        topics: ["REPRODUCTION : HOW LIFE CONTINUES"]
      },
      {
        id: "pa2-2026-chemistry",
        name: "Chemistry",
        topics: ["Atomic foundations of matter"]
      },
      {
        id: "pa2-2026-geography-history",
        name: "Geography & History/DP",
        topics: [
          "Chapter 2: Life on Earth (Theme A: Earth and Life Systems)",
          "Chapter 3: Building a Resilient India (1000–1700 CE) (Theme B: India and the World through Time)"
        ]
      },
      {
        id: "pa2-2026-mathematics",
        name: "Mathematics",
        topics: [
          "Ch.5 - I’m Up and Down, and Round and Round",
          "Ch.7- The Mathematics of Maybe: Introduction to Probability",
          "Ch.8 - Predicting What Comes Next: Exploring Sequences and Progressions"
        ]
      },
      {
        id: "pa2-2026-english",
        name: "English",
        topics: [
          "Literature: The World of Limitless Possibilities",
          "Literature: Twin Melodies",
          "Literature: Nine Gold Medals (Poem)",
          "Literature: A Friend Found in Music (Poem)",
          "Grammar: Parts of Speech",
          "Grammar: Tenses (All types)",
          "Grammar: Modal Auxiliary",
          "Grammar: Reported Speech",
          "Grammar: Editing/Omitting",
          "Grammar: Sentence Rearrangement",
          "Grammar: Sentence Transformation",
          "Writing & Composition: Informal Invitation",
          "Writing & Composition: Letter to Editor",
          "Writing & Composition: E-mail",
          "Writing & Composition: Writing a Factual Description/ Magazine Article",
          "Writing & Composition: Descriptive Essay"
        ]
      },
      {
        id: "pa2-2026-hindi",
        name: "Hindi",
        topics: [
          "पाठ - 4 ऐसी भी बातें होती है",
          "पाठ - 11 झांसी की रानी",
          "पत्र लेखन",
          "संवाद लेखन"
        ]
      },
      {
        id: "pa2-2026-computer",
        name: "Computer Applications",
        topics: [
          "Cyber Safety",
          "Presentation Tools",
          "Graphics, Tables and columns"
        ]
      }
    ];

    syllabus.forEach((item, index) => {
      let subject = data.subjects.find(
        s => s.id === item.id || s.name.trim().toLowerCase() === item.name.toLowerCase()
      );

      if (!subject) {
        subject = {
          id: item.id,
          name: item.name,
          color: colors[data.subjects.length % colors.length],
          topics: []
        };
        data.subjects.push(subject);
      }

      if (!Array.isArray(subject.topics)) subject.topics = [];

      item.topics.forEach((topicName, topicIndex) => {
        const exists = subject.topics.some(
          t => t.name.trim().toLowerCase() === topicName.trim().toLowerCase()
        );

        if (!exists) {
          subject.topics.push({
            id: item.id + "-topic-" + topicIndex,
            name: topicName,
            done: false
          });
        }
      });
    });

    data.pa2Syllabus2026Added = true;
    save();
  }
  render();
})();
