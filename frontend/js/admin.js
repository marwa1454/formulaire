// Configuration API
const API_BASE = 'http://localhost:8000/api/v1';

// État de l'application
let signalements = [];
let currentPage = 1;
const itemsPerPage = 10;
let filtres = {
    type_evenement: '',
    gravite: '',
    date_debut: '',
    date_fin: ''
};

// Mapping des valeurs
const typeLabels = {
    'REUNION_QUARTIER': 'Réunion de quartier',
    'PUBLICATION_RESEAUX': 'Publication réseaux',
    'RASSEMBLEMENT_PUBLIC': 'Rassemblement public',
    'AUTRE': 'Autre'
};

const graviteLabels = {
    'FAIBLE': 'Faible',
    'MOYENNE': 'Moyenne',
    'ELEVEE': 'Élevée'
};

// =====================================
// Chargement des données
// =====================================

async function chargerStatistiques() {
    try {
        const response = await fetch(`${API_BASE}/signalements/statistiques`);
        const stats = await response.json();
        
        document.getElementById('statTotal').textContent = stats.total || 0;
        document.getElementById('statElevee').textContent = stats.par_gravite?.ELEVEE || 0;
        document.getElementById('statSemaine').textContent = stats.cette_semaine || 0;
        document.getElementById('statAujourdhui').textContent = stats.aujourdhui || 0;
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

async function chargerSignalements() {
    try {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('signalementsTable').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';

        // Construire l'URL avec filtres
        const params = new URLSearchParams({
            skip: (currentPage - 1) * itemsPerPage,
            limit: itemsPerPage
        });

        if (filtres.type_evenement) params.append('type_evenement', filtres.type_evenement);
        if (filtres.gravite) params.append('gravite', filtres.gravite);
        if (filtres.date_debut) params.append('date_debut', filtres.date_debut);
        if (filtres.date_fin) params.append('date_fin', filtres.date_fin);

        const response = await fetch(`${API_BASE}/signalements/?${params}`);
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

    // Pagination
    document.getElementById('pagination').style.display = 'flex';
    document.getElementById('pageInfo').textContent = `Page ${currentPage}`;
}

async function afficherDetails(id) {
    try {
        const response = await fetch(`${API_BASE}/signalements/${id}`);
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
// Gestion des filtres et pagination
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

// Fermer modal en cliquant à l'extérieur
document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') {
        fermerModal();
    }
});

// =====================================
// Initialisation
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Admin dashboard initialisé');
    chargerStatistiques();
    chargerSignalements();
    
    // Rafraîchir toutes les 60 secondes
    setInterval(() => {
        chargerStatistiques();
        chargerSignalements();
    }, 60000);
});
