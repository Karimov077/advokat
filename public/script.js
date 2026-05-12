let currentClientId = null;

// Sahifalarni ko'rsatish
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('section-title').innerText = 
        section === 'dashboard' ? 'Dashboard' :
        section === 'clients' ? 'Mijozlar' :
        section === 'cases' ? 'Ishlar' :
        section === 'payments' ? "To'lovlar" :
        section === 'meetings' ? "Uchrashuvlar" : "Arizalar";
    
    // Ma'lumotlarni yuklash
    if (section === 'dashboard') loadStats();
    else if (section === 'clients') loadClients();
    else if (section === 'applications') loadApplications();
    else if (section === 'meetings') loadMeetings();
}

// Logout
function logout() {
    fetch('/api/logout', { method: 'POST' })
        .then(() => window.location.href = '/');
}

// Statistika
function loadStats() {
    fetch('/api/stats')
        .then(res => res.json())
        .then(data => {
            document.getElementById('stats-grid').innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${data.total_clients}</div>
                    <div class="stat-label">Mijozlar</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.total_cases}</div>
                    <div class="stat-label">Ishlar</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.total_income?.toLocaleString() || 0} so'm</div>
                    <div class="stat-label">Daromad</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.pending_applications}</div>
                    <div class="stat-label">Kutilayotgan arizalar</div>
                </div>
            `;
        });
}

// Mijozlarni yuklash
function loadClients() {
    fetch('/api/clients')
        .then(res => res.json())
        .then(clients => {
            const tbody = document.getElementById('clients-list');
            tbody.innerHTML = clients.map(client => `
                <tr>
                    <td>${client.id}</td>
                    <td>${client.fullname}</td>
                    <td>${client.phone}</td>
                    <td>${client.passport || '-'}</td>
                    <td>${client.address || '-'}</td>
                    <td>
                        <button onclick="viewClient(${client.id})" class="btn-small">👁️ Ko'rish</button>
                        <button onclick="addCaseForClient(${client.id})" class="btn-small">⚖️ Ish qo'shish</button>
                        <button onclick="addPaymentForClient(${client.id})" class="btn-small">💰 To'lov</button>
                    </td>
                </tr>
            `).join('');
            
            // Select'larni to'ldirish
            const selects = ['client-select-cases', 'client-select-payments'];
            selects.forEach(sel => {
                const select = document.getElementById(sel);
                if (select) {
                    select.innerHTML = '<option value="">Mijoz tanlang</option>' + 
                        clients.map(c => `<option value="${c.id}">${c.fullname}</option>`).join('');
                }
            });
        });
}

// Yangi mijoz modal
function showAddClientModal() {
    document.getElementById('client-modal').style.display = 'block';
}

document.getElementById('client-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = {
        fullname: document.getElementById('fullname').value,
        phone: document.getElementById('phone').value,
        passport: document.getElementById('passport').value,
        address: document.getElementById('address').value
    };
    
    fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    }).then(() => {
        closeModal('client-modal');
        loadClients();
        alert("✅ Mijoz qo'shildi!");
    });
});

// Uchrashuvlarni yuklash
function loadMeetings() {
    fetch('/api/todays-meetings')
        .then(res => res.json())
        .then(meetings => {
            document.getElementById('meetings-list').innerHTML = `
                <div class="meetings-container">
                    <h3>Bugungi uchrashuvlar (${new Date().toLocaleDateString('uz-UZ')})</h3>
                    ${meetings.length ? meetings.map(m => `
                        <div class="meeting-card">
                            <strong>${m.fullname}</strong> (${m.phone})<br>
                            🕐 ${new Date(m.meeting_date).toLocaleString('uz-UZ')}<br>
                            📍 ${m.location || 'Manzil yo‘q'}<br>
                            📝 ${m.notes || 'Izoh yo‘q'}
                        </div>
                    `).join('') : '<p>Bugun uchrashuv yo‘q</p>'}
                </div>
            `;
        });
}

// Arizalarni yuklash
function loadApplications() {
    fetch('/api/applications')
        .then(res => res.json())
        .then(apps => {
            document.getElementById('applications-list').innerHTML = apps.map(app => `
                <div class="application-card">
                    <div class="app-header">
                        <strong>${app.client_name}</strong> (${app.client_phone})
                        <span class="status ${app.status}">${app.status === 'kutilmoqda' ? '⏳ Kutilmoqda' : '✅ Ko‘rilgan'}</span>
                    </div>
                    <div class="app-type">⚖️ ${app.case_type}</div>
                    <div class="app-message">${app.message}</div>
                    <div class="app-date">📅 ${new Date(app.created_at).toLocaleString('uz-UZ')}</div>
                </div>
            `).join('');
        });
}

// Hujjat generatsiya
function generateDocument(type) {
    fetch('/api/generate-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, clientId: currentClientId })
    })
    .then(res => res.json())
    .then(data => {
        alert(`✅ Hujjat yaratildi!\n${data.content}`);
    });
}

// Modal yopish
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Sayt yuklanganda
window.onload = () => {
    loadStats();
    setInterval(() => {
        if (document.getElementById('dashboard-section').classList.contains('active')) {
            loadStats();
        }
    }, 30000); // Har 30 sek yangilanadi
};

// Modalga click tashqarisida yopish
window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};