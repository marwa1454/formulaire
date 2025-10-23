// Configuration API
const API_BASE = 'http://localhost:8000/api/v1';

// État de l'application
let currentUser = null;
let signalements = [];
let currentPage = 1;
const itemsPerPage = 10;
let filtres = {
    type_evenement: '',
    gravite: '',
    date_debut: '',
    date_fin: ''
};

// Mapping CORRIGÉ des valeurs
const typeLabels = {
    'REUNION_QUARTIER': 'Réunion de quartier',
    'PUBLICATION_RESEAUX': 'Publication sur les réseaux',  // ← CORRIGÉ
    'RASSEMBLEMENT_PUBLIC': 'Rassemblement public',
    'AUTRE': 'Autre'
};

const graviteLabels = {
    'FAIBLE': 'Faible',        // ← CORRIGÉ
    'MOYENNE': 'Moyenne',      // ← CORRIGÉ  
    'ELEVEE': 'Élevée'         // ← CORRIGÉ
};

const sourceLabels = {
    'OBSERVATION_DIRECTE': 'Observation directe',  // ← AJOUTEZ
    'INFORMATEUR': 'Informateur',
    'RESEAUX_SOCIAUX': 'Réseaux sociaux', 
    'AUTRE': 'Autre'
};

const actionLabels = {
    'OBSERVATION': 'Observation',        // ← AJOUTEZ
    'ALERTE_TRANSMISE': 'Alerte transmise',
    'INTERVENTION': 'Intervention',
    'AUTRE': 'Autre'
};

// =====================================
// GESTION DE LA CONNEXION
// =====================================

// =====================================
// FONCTIONS UTILITAIRES
// =====================================

function setCurrentDateTime() {
    // Date et heure actuelles
    const now = new Date();
    
    // Format YYYY-MM-DD pour input date
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;
    
    // Format HH:MM pour input time
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    // Mettre à jour tous les champs date et heure
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const timeInputs = document.querySelectorAll('input[type="time"]');
    
    dateInputs.forEach(input => {
        if (!input.value) { // Ne remplir que si vide
            input.value = currentDate;
        }
    });
    
    timeInputs.forEach(input => {
        if (!input.value) { // Ne remplir que si vide
            input.value = currentTime;
        }
    });
}

// Fonction pour rafraîchir l'heure toutes les minutes
function startDateTimeAutoUpdate() {
    setCurrentDateTime(); // Initialisation
    
    // Rafraîchir toutes les minutes
    setInterval(setCurrentDateTime, 60000);
}


async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    errorDiv.classList.add('hidden');
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        });
        
        if (!response.ok) {
            throw new Error('Identifiants incorrects');
        }
        
        const data = await response.json();
        
        // Stocker le token et les infos utilisateur
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        currentUser = data.user;
        
        // Afficher la bonne page selon le rôle
        showPageForRole(data.user.role);
        
    } catch (error) {
        console.error('Erreur connexion:', error);
        errorDiv.textContent = error.message || 'Erreur de connexion';
        errorDiv.classList.remove('hidden');
    }
}

function showPageForRole(role) {
    document.getElementById('loginPage').classList.add('hidden');
    
    // Afficher le badge utilisateur et le bouton de déconnexion
    const userBadge = document.getElementById('userBadge');
    const logoutBtn = document.getElementById('logoutBtn');
    userBadge.textContent = `👤 ${currentUser.username}`;
    userBadge.style.display = 'block';
    logoutBtn.classList.remove('hidden');
    
    if (role === 'ADMIN') {
        document.getElementById('adminPage').classList.remove('hidden');
        document.getElementById('userPage').classList.add('hidden');
        // Charger le dashboard admin
        chargerStatistiques();
    } else {
        document.getElementById('userPage').classList.remove('hidden');
        document.getElementById('adminPage').classList.add('hidden');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    
    // Cacher le badge et le bouton
    document.getElementById('userBadge').style.display = 'none';
    document.getElementById('logoutBtn').classList.add('hidden');
    
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('userPage').classList.add('hidden');
    document.getElementById('adminPage').classList.add('hidden');
    
    document.getElementById('loginForm').reset();
}

// Fonction appelée par le bouton HTML
function deconnexion() {
    logout();
}

// =====================================
// FORMULAIRE AGENT
// =====================================

// Toggle des champs conditionnels
document.addEventListener('change', (e) => {
    if (e.target.name === 'source') {
        const autreField = document.getElementById('sourceAutreField');
        autreField.classList.toggle('hidden', e.target.value !== 'AUTRE');
    }
    if (e.target.name === 'action') {
        const autreField = document.getElementById('actionAutreField');
        autreField.classList.toggle('hidden', e.target.value !== 'AUTRE');
    }
    
    // Pour le formulaire admin
    if (e.target.name === 'adminSource') {
        const autreField = document.getElementById('adminSourceAutreField');
        autreField.classList.toggle('hidden', e.target.value !== 'AUTRE');
    }
    if (e.target.name === 'adminAction') {
        const autreField = document.getElementById('adminActionAutreField');
        autreField.classList.toggle('hidden', e.target.value !== 'AUTRE');
    }
});

async function handleAgentReport(e) {
    e.preventDefault();
    
    console.log('🚀 DÉBUT SOUMISSION AVEC MAPPING CORRECT');
    
    // Récupérer les valeurs AVEC MAPPING
    const typeValue = document.getElementById('typeEvenement').value;
    const graviteValue = document.querySelector('input[name="gravite"]:checked')?.value;
    const sourceValue = document.querySelector('input[name="source"]:checked')?.value;
    const actionValue = document.querySelector('input[name="action"]:checked')?.value;
    
    // Appliquer le mapping
    const typeMapped = typeLabels[typeValue] || typeValue;
    const graviteMapped = graviteLabels[graviteValue] || graviteValue;
    const sourceMapped = sourceLabels[sourceValue] || sourceValue;
    const actionMapped = actionLabels[actionValue] || actionValue;
    
    console.log('🔄 MAPPING:', {
        type: `${typeValue} → ${typeMapped}`,
        gravite: `${graviteValue} → ${graviteMapped}`,
        source: `${sourceValue} → ${sourceMapped}`,
        action: `${actionValue} → ${actionMapped}`
    });
    
    // Date et heure actuelles
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const formData = {
        date_signalement: `${year}-${month}-${day}`,
        heure_signalement: `${hours}:${minutes}`,
        nom_agent: document.getElementById('nomAgent').value || "Agent",
        id_agent: document.getElementById('idAgent').value || "ID001",
        type_evenement: typeMapped,          // ← VALEUR MAPPÉE
        gravite: graviteMapped,              // ← VALEUR MAPPÉE
        lieu: document.getElementById('lieu').value || "Lieu",
        source_information: sourceMapped,    // ← VALEUR MAPPÉE
        source_autre: document.getElementById('sourceAutre').value || null,
        action_entreprise: actionMapped,     // ← VALEUR MAPPÉE
        action_autre: document.getElementById('actionAutre').value || null,
        commentaire_complementaire: document.getElementById('commentaire').value || null
    };
    
    console.log('📤 DONNÉES CORRECTES:', formData);
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/signalements/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        console.log('📡 STATUT:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ SUCCÈS:', result);
            alert('✅ Signalement créé avec succès!');
            document.getElementById('reportForm').reset();
        } else {
            const errorData = await response.json();
            console.error('❌ ERREUR API:', errorData);
            alert('❌ Erreur: ' + (errorData.detail || 'Erreur de soumission'));
        }
        
    } catch (error) {
        console.error('💥 ERREUR:', error);
        alert('❌ Erreur réseau: ' + error.message);
    }
}

// =====================================
// FORMULAIRE ADMIN
// =====================================

async function handleAdminReport(e) {
    e.preventDefault();
    
    console.log('🚀 ADMIN - DÉBUT SOUMISSION AVEC MAPPING');
    
    // Récupérer les valeurs AVEC MAPPING
    const typeValue = document.getElementById('adminTypeEvenement').value;
    const graviteValue = document.querySelector('input[name="adminGravite"]:checked')?.value;
    const sourceValue = document.querySelector('input[name="adminSource"]:checked')?.value;
    const actionValue = document.querySelector('input[name="adminAction"]:checked')?.value;
    
    // Appliquer le mapping
    const typeMapped = typeLabels[typeValue] || typeValue;
    const graviteMapped = graviteLabels[graviteValue] || graviteValue;
    const sourceMapped = sourceLabels[sourceValue] || sourceValue;
    const actionMapped = actionLabels[actionValue] || actionValue;
    
    console.log('🔄 ADMIN MAPPING:', {
        type: `${typeValue} → ${typeMapped}`,
        gravite: `${graviteValue} → ${graviteMapped}`,
        source: `${sourceValue} → ${sourceMapped}`,
        action: `${actionValue} → ${actionMapped}`
    });
    
    // Date et heure
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const formData = {
        date_signalement: `${year}-${month}-${day}`,
        heure_signalement: `${hours}:${minutes}`,
        nom_agent: document.getElementById('adminNomAgent').value || "Agent Admin",
        id_agent: document.getElementById('adminIdAgent').value || "ADMIN001",
        type_evenement: typeMapped,          // ← VALEUR MAPPÉE
        gravite: graviteMapped,              // ← VALEUR MAPPÉE
        lieu: document.getElementById('adminLieu').value || "Lieu Admin",
        source_information: sourceMapped,    // ← VALEUR MAPPÉE
        source_autre: document.getElementById('adminSourceAutre').value || null,
        action_entreprise: actionMapped,     // ← VALEUR MAPPÉE
        action_autre: document.getElementById('adminActionAutre').value || null,
        commentaire_complementaire: document.getElementById('adminCommentaire').value || null
    };
    
    console.log('📤 ADMIN DONNÉES CORRECTES:', formData);
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/signalements/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        console.log('📡 ADMIN STATUT:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ ADMIN SUCCÈS:', result);
            alert('✅ Signalement admin créé avec succès!');
            document.getElementById('adminReportForm').reset();
            
            // Recharger les stats
            chargerStatistiques();
        } else {
            const errorData = await response.json();
            console.error('❌ ADMIN ERREUR API:', errorData);
            alert('❌ Erreur admin: ' + (errorData.detail || 'Erreur de soumission'));
        }
        
    } catch (error) {
        console.error('💥 ADMIN ERREUR:', error);
        alert('❌ Erreur réseau admin: ' + error.message);
    }
}
// =====================================
// DASHBOARD ADMIN - NAVIGATION TABS
// =====================================

function switchTab(tabName) {
    // Cacher tous les tabs
    document.getElementById('tabFormulaire').classList.add('hidden');
    document.getElementById('tabDashboard').classList.add('hidden');
    
    // Désactiver tous les boutons
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    
    // Activer le bon tab
    if (tabName === 'formulaire') {
        document.getElementById('tabFormulaire').classList.remove('hidden');
        document.querySelectorAll('.nav-tab')[0].classList.add('active');
    } else {
        document.getElementById('tabDashboard').classList.remove('hidden');
        document.querySelectorAll('.nav-tab')[1].classList.add('active');
        chargerSignalements();
    }
}

// =====================================
// DASHBOARD ADMIN - STATS
// =====================================

async function chargerStatistiques() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/signalements/statistiques`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stats = await response.json();
        
        document.getElementById('statTotal').textContent = stats.total || 0;
        document.getElementById('statElevee').textContent = stats.par_gravite?.ELEVEE || 0;
        document.getElementById('statSemaine').textContent = stats.cette_semaine || 0;
        document.getElementById('statAujourdhui').textContent = stats.aujourdhui || 0;
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

// =====================================
// DASHBOARD ADMIN - LISTE SIGNALEMENTS
// =====================================

async function chargerSignalements() {
    try {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('signalementsTable').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';

        const params = new URLSearchParams({
            skip: (currentPage - 1) * itemsPerPage,
            limit: itemsPerPage
        });

        if (filtres.type_evenement) params.append('type_evenement', filtres.type_evenement);
        if (filtres.gravite) params.append('gravite', filtres.gravite);
        if (filtres.date_debut) params.append('date_debut', filtres.date_debut);
        if (filtres.date_fin) params.append('date_fin', filtres.date_fin);

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/signalements/?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        signalements = await response.json();

        document.getElementById('loadingState').style.display = 'none';

        if (signalements.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            document.getElementById('tableCount').textContent = '0 résultats';
        } else {
            afficherSignalements();
        }
    } catch (error) {
        console.error('Erreur chargement signalements:', error);
        document.getElementById('loadingState').textContent = 'Erreur de chargement';
    }
}

function afficherSignalements() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    document.getElementById('signalementsTable').style.display = 'table';
    document.getElementById('tableCount').textContent = `${signalements.length} résultat(s)`;

    signalements.forEach(sig => {
        const tr = document.createElement('tr');
        tr.onclick = () => afficherDetails(sig.id);
        
        const graviteClass = sig.gravite.toLowerCase();
        
        tr.innerHTML = `
            <td><strong>#${sig.id}</strong></td>
            <td>${new Date(sig.date_signalement).toLocaleDateString('fr-FR')}</td>
            <td>${sig.heure_signalement}</td>
            <td>${typeLabels[sig.type_evenement] || sig.type_evenement}</td>
            <td><span class="badge badge-${graviteClass}">${graviteLabels[sig.gravite]}</span></td>
            <td>${sig.lieu}</td>
            <td>${sig.nom_agent}</td>
        `;
        
        tbody.appendChild(tr);
    });

    document.getElementById('pagination').style.display = 'flex';
    document.getElementById('pageInfo').textContent = `Page ${currentPage}`;
}

async function afficherDetails(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/signalements/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const sig = await response.json();

        document.getElementById('modalId').textContent = sig.id;
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="detail-row">
                <div class="detail-label">Date et heure</div>
                <div class="detail-value">
                    ${new Date(sig.date_signalement).toLocaleDateString('fr-FR')} à ${sig.heure_signalement}
                </div>
            </div>

            <div class="detail-row">
                <div class="detail-label">Type d'événement</div>
                <div class="detail-value">${typeLabels[sig.type_evenement] || sig.type_evenement}</div>
            </div>

            <div class="detail-row">
                <div class="detail-label">Gravité</div>
                <div class="detail-value">
                    <span class="badge badge-${sig.gravite.toLowerCase()}">${graviteLabels[sig.gravite]}</span>
                </div>
            </div>

            <div class="detail-row">
                <div class="detail-label">Lieu</div>
                <div class="detail-value">${sig.lieu}</div>
            </div>

            <div class="detail-row">
                <div class="detail-label">Agent</div>
                <div class="detail-value">${sig.nom_agent} (ID: ${sig.id_agent})</div>
            </div>

            <div class="detail-row">
                <div class="detail-label">Source d'information</div>
                <div class="detail-value">
                    ${sig.source_information}
                    ${sig.source_autre ? `<br><em>${sig.source_autre}</em>` : ''}
                </div>
            </div>

            <div class="detail-row">
                <div class="detail-label">Action entreprise</div>
                <div class="detail-value">
                    ${sig.action_entreprise}
                    ${sig.action_autre ? `<br><em>${sig.action_autre}</em>` : ''}
                </div>
            </div>

            ${sig.commentaire_complementaire ? `
            <div class="detail-row">
                <div class="detail-label">Commentaire</div>
                <div class="detail-value">${sig.commentaire_complementaire}</div>
            </div>
            ` : ''}

            <div class="detail-row">
                <div class="detail-label">Créé le</div>
                <div class="detail-value">
                    ${new Date(sig.created_at).toLocaleString('fr-FR')}
                </div>
            </div>
        `;

        document.getElementById('detailModal').classList.add('active');
    } catch (error) {
        console.error('Erreur chargement détails:', error);
        alert('Impossible de charger les détails');
    }
}

// =====================================
// FILTRES ET PAGINATION
// =====================================

function appliquerFiltres() {
    filtres = {
        type_evenement: document.getElementById('filterType').value,
        gravite: document.getElementById('filterGravite').value,
        date_debut: document.getElementById('filterDateDebut').value,
        date_fin: document.getElementById('filterDateFin').value
    };
    
    currentPage = 1;
    chargerSignalements();
}

function reinitialiserFiltres() {
    document.getElementById('filterType').value = '';
    document.getElementById('filterGravite').value = '';
    document.getElementById('filterDateDebut').value = '';
    document.getElementById('filterDateFin').value = '';
    
    filtres = { type_evenement: '', gravite: '', date_debut: '', date_fin: '' };
    currentPage = 1;
    chargerSignalements();
}

function changerPage(direction) {
    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    chargerSignalements();
}

function fermerModal() {
    document.getElementById('detailModal').classList.remove('active');
}

// =====================================
// INITIALISATION
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Application initialisée');
    
    // Event listeners pour les formulaires
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('reportForm').addEventListener('submit', handleAgentReport);
    document.getElementById('adminReportForm').addEventListener('submit', handleAdminReport);
    
    // Event listener pour fermer le modal
    document.getElementById('detailModal').addEventListener('click', (e) => {
        if (e.target.id === 'detailModal') {
            fermerModal();
        }
    });
    
    // Démarrer la mise à jour automatique de la date/heure
    startDateTimeAutoUpdate();
    
    // Vérifier si déjà connecté
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        showPageForRole(currentUser.role);
    }
});