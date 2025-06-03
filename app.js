(function() {
  const nav = document.getElementById('nav');
  const content = document.getElementById('content');
  let currentUser = null;
  let transcripts = [];

  function init() {
    renderNav();
    showLogin();
  }

  function renderNav() {
    nav.innerHTML = '';
    if (currentUser) {
      const links = [
        { id: 'dashboard', label: 'My Interviews' },
        { id: 'upload', label: 'New Transcript Upload' },
        { id: 'help', label: 'Researcher Guidance' },
        { id: 'logout', label: 'Logout' }
      ];
      links.forEach(l => {
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = l.label;
        a.onclick = (e) => {
          e.preventDefault();
          if (l.id === 'logout') {
            logout();
          } else {
            router(l.id);
          }
        };
        nav.appendChild(a);
      });
    } else {
      nav.textContent = '';
    }
  }

  function router(page, data) {
    switch (page) {
      case 'login': showLogin(); break;
      case 'register': showRegister(); break;
      case 'dashboard': showDashboard(); break;
      case 'upload': showUpload(); break;
      case 'view': showViewer(data); break;
      case 'help': showHelp(); break;
      default: showLogin();
    }
  }

  function showLogin() {
    content.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'container';
    div.innerHTML = `
      <h2>Login</h2>
      <form id="loginForm">
        <input id="loginEmail" type="email" placeholder="Email" required />
        <input id="loginPass" type="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
      <p>No account? <a href="#" id="showRegister">Register here</a></p>
    `;
    content.appendChild(div);
    document.getElementById('showRegister').onclick = (e)=>{e.preventDefault();router('register');};
    document.getElementById('loginForm').onsubmit = (e)=>{
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const pass = document.getElementById('loginPass').value;
      const users = JSON.parse(localStorage.getItem('users')||'[]');
      const user = users.find(u => u.email===email && u.pass===pass);
      if (user) {
        currentUser = user;
        transcripts = JSON.parse(localStorage.getItem('tx_'+user.email)||'[]');
        renderNav();
        router('dashboard');
      } else {
        alert('Invalid credentials');
      }
    };
  }

  function showRegister() {
    content.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'container';
    div.innerHTML = `
      <h2>Register</h2>
      <form id="regForm">
        <input id="regName" placeholder="Name" required />
        <input id="regSurname" placeholder="Surname" required />
        <input id="regInstitution" placeholder="Institution" required />
        <input id="regStudy" placeholder="Study Title" required />
        <input id="regEmail" type="email" placeholder="Email" required />
        <input id="regPass" type="password" placeholder="Password" required />
        <button type="submit">Register</button>
      </form>
      <p>Already registered? <a href="#" id="showLogin">Login</a></p>
    `;
    content.appendChild(div);
    document.getElementById('showLogin').onclick = (e)=>{e.preventDefault();router('login');};
    document.getElementById('regForm').onsubmit = (e)=>{
      e.preventDefault();
      const user = {
        name: document.getElementById('regName').value,
        surname: document.getElementById('regSurname').value,
        institution: document.getElementById('regInstitution').value,
        study: document.getElementById('regStudy').value,
        email: document.getElementById('regEmail').value,
        pass: document.getElementById('regPass').value
      };
      const users = JSON.parse(localStorage.getItem('users')||'[]');
      if (users.find(u=>u.email===user.email)) {
        alert('User already exists');
        return;
      }
      users.push(user);
      localStorage.setItem('users', JSON.stringify(users));
      alert('Registered. Please login.');
      router('login');
    };
  }

  function logout() {
    currentUser = null;
    transcripts = [];
    renderNav();
    router('login');
  }

  function showDashboard() {
    if (!currentUser) { router('login'); return; }
    content.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'container';
    const list = transcripts.map((t,i)=>`<li><a href="#" data-id="${i}" class="viewTx">${t.name}</a></li>`).join('');
    div.innerHTML = `
      <h2>My Interviews</h2>
      <ul>${list}</ul>
      <button id="newTx">New Transcript Upload</button>
    `;
    content.appendChild(div);
    document.querySelectorAll('.viewTx').forEach(a=>{
      a.onclick = (e)=>{e.preventDefault();const id=e.target.getAttribute('data-id');router('view',parseInt(id));};
    });
    document.getElementById('newTx').onclick = ()=>router('upload');
  }

  function showUpload() {
    if (!currentUser) { router('login'); return; }
    content.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'container';
    div.innerHTML = `
      <h2>New Transcript Upload</h2>
      <input id="txName" placeholder="Transcript Name" required />
      <textarea id="txText" rows="10" placeholder="Paste transcript text here"></textarea>
      <input type="file" id="txFile" accept=".txt" />
      <button id="processTx">Process Transcript</button>
    `;
    content.appendChild(div);
    document.getElementById('txFile').onchange = (e)=>{
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(ev){ document.getElementById('txText').value = ev.target.result; };
        reader.readAsText(file);
      }
    };
    document.getElementById('processTx').onclick = ()=>{
      const name = document.getElementById('txName').value.trim();
      const text = document.getElementById('txText').value.trim();
      if (!name || !text) { alert('Name and transcript required'); return; }
      const parsed = parseTranscript(text);
      const tx = { name, parsed };
      transcripts.push(tx);
      localStorage.setItem('tx_'+currentUser.email, JSON.stringify(transcripts));
      router('view', transcripts.length-1);
    };
  }

  function parseTranscript(text) {
    const lines = text.split(/\r?\n/);
    const parsed = [];
    let lineNum = 1;
    lines.forEach(line => {
      line = line.trim();
      if (!line) return;
      let speaker = null;
      if (line.startsWith('Interviewer: ')) {
        speaker = 'Interviewer';
        line = line.replace(/^Interviewer: /,'');
      } else if (line.startsWith('Participant: ')) {
        speaker = 'Participant';
        line = line.replace(/^Participant: /,'');
      }
      if (speaker) {
        parsed.push({line: lineNum++, speaker, text: line});
      }
    });
    return parsed;
  }

  function showViewer(id) {
    if (!currentUser) { router('login'); return; }
    const tx = transcripts[id];
    if (!tx) { router('dashboard'); return; }
    content.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'container';
    const rows = tx.parsed.map(p=>`<tr><td>${p.line}</td><td>${p.speaker}</td><td>${p.text}</td></tr>`).join('');
    div.innerHTML = `
      <h2>${tx.name}</h2>
      <table class="table">
        <thead><tr><th>Line</th><th>Speaker</th><th>Utterance</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <button id="expCsv">Export CSV</button>
      <button id="expJson">Export JSON</button>
      <button id="expTxt">Export Text</button>
    `;
    content.appendChild(div);
    document.getElementById('expCsv').onclick = ()=>exportCsv(tx);
    document.getElementById('expJson').onclick = ()=>exportJson(tx);
    document.getElementById('expTxt').onclick = ()=>exportTxt(tx);
  }

  function exportCsv(tx) {
    const header = 'Line,Speaker,Utterance\n';
    const rows = tx.parsed.map(p=>`${p.line},"${p.speaker}","${p.text.replace(/"/g,'""')}"`).join('\n');
    download(header+rows, tx.name+'.csv', 'text/csv');
  }

  function exportJson(tx) {
    download(JSON.stringify(tx.parsed, null, 2), tx.name+'.json', 'application/json');
  }

  function exportTxt(tx) {
    const rows = tx.parsed.map(p=>`${p.speaker}: ${p.text}`).join('\n');
    download(rows, tx.name+'.txt', 'text/plain');
  }

  function download(data, filename, type) {
    const blob = new Blob([data], {type});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function showHelp() {
    if (!currentUser) { router('login'); return; }
    content.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'container';
    div.innerHTML = `
      <h2>Researcher Guidance</h2>
      <p>Format your transcript using explicit speaker tags on each line:</p>
      <pre>Interviewer: Hello\nParticipant: Hi there</pre>
      <p>Common issues include missing prefixes or multi-line utterances. Ensure each line contains one utterance.</p>
    `;
    content.appendChild(div);
  }

  window.addEventListener('load', init);
})();
