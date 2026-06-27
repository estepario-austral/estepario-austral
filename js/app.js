const APP = document.getElementById('app');
const ARCHIVE = document.getElementById('archive');
const SEARCH = document.getElementById('search');
const STATUS = document.getElementById('status');

let songs = [];

function t(msg){return msg}

async function loadData(){
  try{
    const res = await fetch('/data/songs.json', {cache:'no-store'});
    songs = await res.json();
    renderList(songs);
    restoreLastOpen();
  }catch(e){
    STATUS.textContent = 'Error cargando datos.';
    console.error(e);
  }
}

function renderList(list){
  ARCHIVE.innerHTML = '';
  if(list.length===0){ARCHIVE.textContent = 'No se encontraron archivos.';return}
  for(const s of list){
    const entry = document.createElement('article');
    entry.className = 'entry';
    entry.tabIndex = 0;

    const meta = document.createElement('div');meta.className='meta';
    const h = document.createElement('h3');h.textContent = s.title;meta.appendChild(h);
    const small = document.createElement('div');small.className='small';small.textContent = `${s.tuning || '—'} • ${s.tempo || '—'}`;meta.appendChild(small);

    const controls = document.createElement('div');controls.className='buttons';
    const openBtn = document.createElement('button');openBtn.className='btn';openBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Abrir</span>';
    openBtn.title='Abrir archivo';openBtn.setAttribute('aria-expanded','false');
    openBtn.addEventListener('click',()=>togglePanel());
    const copyBtn = document.createElement('button');copyBtn.className='btn';copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="8" height="8" stroke="currentColor" stroke-width="1.6" rx="1"/></svg><span>Copiar letras</span>';
    copyBtn.addEventListener('click',()=>copyLyrics(s.lyrics));

    controls.appendChild(openBtn);controls.appendChild(copyBtn);

    entry.appendChild(meta);entry.appendChild(controls);

    const panel = document.createElement('div');panel.className='panel';panel.setAttribute('aria-hidden','true');
    const lyrics = document.createElement('div');lyrics.className='lyrics';lyrics.textContent = s.lyrics || '';
    panel.appendChild(lyrics);
    if(s.notes){
      const notes = document.createElement('p');notes.className='small';notes.textContent = 'Notas: '+s.notes;panel.appendChild(notes);
    }

    entry.appendChild(panel);

    // accessibility: toggle on enter
    entry.addEventListener('keydown', (ev)=>{if(ev.key==='Enter' || ev.key===' ') { ev.preventDefault(); togglePanel(); }});

    ARCHIVE.appendChild(entry);

    // store references
    entry._panel = panel; entry._openBtn = openBtn; entry._id = s.id;

    function togglePanel(){
      const isOpen = panel.classList.contains('open');
      if(!isOpen){
        panel.classList.add('open');panel.setAttribute('aria-hidden','false');
        openBtn.setAttribute('aria-expanded','true');
        openBtn.querySelector('span').textContent = 'Cerrar';
        localStorage.setItem('ea.last', s.id);
      }else{
        panel.classList.remove('open');panel.setAttribute('aria-hidden','true');
        openBtn.setAttribute('aria-expanded','false');
        openBtn.querySelector('span').textContent = 'Abrir';
        localStorage.removeItem('ea.last');
      }
    }
  }
  STATUS.textContent = `${list.length} archivos`;
}

function copyLyrics(text){
  if(!navigator.clipboard) return alert('Portapapeles no soportado');
  navigator.clipboard.writeText(text).then(()=>{STATUS.textContent='Letras copiadas';setTimeout(()=>STATUS.textContent='',1500)});
}

function filter(q){
  q = (q||'').trim().toLowerCase();
  if(!q) return renderList(songs);
  const out = songs.filter(s=> (s.title||'').toLowerCase().includes(q) || (s.lyrics||'').toLowerCase().includes(q));
  renderList(out);
}

function restoreLastOpen(){
  const last = localStorage.getItem('ea.last');
  if(!last) return;
  // find entry and open
  const nodes = Array.from(ARCHIVE.children);
  for(const n of nodes){
    if(n._id===last){
      n._panel.classList.remove('hidden');n._panel.setAttribute('aria-hidden','false');n._openBtn.textContent='Cerrar';
      n.scrollIntoView({behavior:'smooth',block:'center'});
      break;
    }
  }
}

// search
SEARCH.addEventListener('input', e=>filter(e.target.value));

// initial boot with loader
window.addEventListener('load', ()=>{
  // minimal 1s loader
  setTimeout(()=>{
    document.getElementById('loader').classList.add('hidden');
    APP.classList.remove('hidden');
    loadData();
  }, 900);
});
