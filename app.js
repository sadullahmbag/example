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
        { id: 'education', label: 'Interview Guide' },
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
      case 'education': showEducation(); break;
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

  function showEducation() {
    if (!currentUser) { router('login'); return; }
    content.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'container';
    div.innerHTML = `
      <h2>Interview Guide</h2>
      <p>Below is a step-by-step playbook you can adapt for most qualitative projects. It draws on guidance from Bryman, Baxter & Babbie, and Corbin & Strauss.</p>
      <ol>
        <li><strong>Clarify why you are interviewing</strong>
          <ul>
            <li>Link to the research question and what interviewees can report.</li>
            <li>Choose the style that fits your aims:
              <ul>
                <li>Structured &ndash; comparability across participants.</li>
                <li>Semi-structured &ndash; core guide with freedom to probe.</li>
                <li>Unstructured/life-history &ndash; participant led.</li>
              </ul>
            </li>
          </ul>
        </li>
        <li><strong>Sampling and recruiting</strong>
          <ul>
            <li>Define a population that illuminates your phenomenon.</li>
            <li>Use purposeful strategies such as maximum variation or snowball sampling.</li>
            <li>Stop when thematic saturation is reached (often 15&ndash;30 interviews).</li>
          </ul>
        </li>
        <li><strong>Design the interview guide</strong>
          <ul>
            <li>Begin with warm-up questions; move from descriptive to reflective.</li>
            <li>Keep a short list of core questions and probes.</li>
            <li>Check alignment with your conceptual framework and pilot-test.</li>
          </ul>
        </li>
        <li><strong>Ethics and logistics</strong>
          <ul>
            <li>Obtain ethics approval and create a clear consent form.</li>
            <li>Plan how you will record interviews and ensure privacy.</li>
          </ul>
        </li>
        <li><strong>Conducting the interview</strong>
          <ul>
            <li>Establish rapport and follow the guide flexibly.</li>
            <li>Probe for depth and meaning; respect silences.</li>
          </ul>
        </li>
        <li><strong>After the interview</strong>
          <ul>
            <li>Write field notes immediately and transcribe verbatim.</li>
            <li>De-identify data and store materials securely.</li>
          </ul>
        </li>
        <li><strong>Analyse the material</strong>
          <ul>
            <li>Start with open coding then move to focused or axial coding.</li>
            <li>Integrate categories into themes or a process model.</li>
            <li>Software such as NVivo or MAXQDA can help with large datasets.</li>
          </ul>
        </li>
        <li><strong>Ensure quality and credibility</strong>
          <ul>
            <li>Member-check, keep an audit trail, and write reflexive memos.</li>
            <li>Provide thick description for transferability.</li>
          </ul>
        </li>
        <li><strong>Reporting findings</strong>
          <ul>
            <li>Describe your methods clearly and present themes with anonymised quotes.</li>
            <li>Discuss how the themes relate to existing literature.</li>
          </ul>
        </li>
      </ol>
      <h3>Quick checklist</h3>
      <ul>
        <li>Research question and interview purpose aligned</li>
        <li>Sampling plan and consent approved</li>
        <li>Guide piloted</li>
        <li>Recording and data security organised</li>
        <li>Transparent coding, reflexive notes, and audit trail</li>
        <li>Illustrative, anonymised quotations in the write-up</li>
      </ul>
    `;
    content.appendChild(div);
  }

  window.addEventListener('load', init);
})();
