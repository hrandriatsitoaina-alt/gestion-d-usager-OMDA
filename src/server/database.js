// src/server/database.js
const { Pool } = require('pg');

// ============================================================
// CONFIGURATION DE LA BASE DE DONNÉES
// ============================================================
const pool = new Pool({
  user: 'omda_user',
  password: 'Omda2026',
  host: 'localhost',
  port: 5432,
  database: 'omda_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// ✅ Définir le schéma par défaut pour TOUTES les connexions
pool.on('connect', (client) => {
  client.query('SET search_path TO omda_app, public;')
    .catch(err => console.warn('⚠️ Erreur SET search_path:', err.message));
});

pool.on('error', (err) => {
  console.error('❌ Erreur inattendue du pool PostgreSQL:', err);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erreur de connexion à PostgreSQL:', err.message);
    console.error('📌 Vérifiez que PostgreSQL est en cours d\'exécution');
    console.error('📌 Vérifiez les identifiants dans la configuration');
    process.exit(1);
  } else {
    console.log('✅ Connecté à PostgreSQL');
    release();
  }
});

// ============================================================
// FONCTION D'INITIALISATION COMPLÈTE
// ============================================================
async function initDB() {
  try {
    console.log('🔍 Initialisation de la base de données...');

    // Créer le schéma omda_app s'il n'existe pas
    try {
      await pool.query('CREATE SCHEMA IF NOT EXISTS omda_app AUTHORIZATION omda_user;');
      console.log('✅ Schéma "omda_app" prêt.');
    } catch (schemaErr) {
      console.warn('⚠️ Le schéma omda_app existe déjà ou ne peut pas être créé.');
    }

    // Forcer le search_path pour cette session
    await pool.query('SET search_path TO omda_app, public;');
    console.log('📁 Utilisation du schéma : omda_app');

    // ============================================================
    // TABLE UTILISATEURS
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS utilisateurs (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        mot_de_passe VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        statut VARCHAR(20) DEFAULT 'actif',
        prefix VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        derniere_connexion TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
      CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(role);
      CREATE INDEX IF NOT EXISTS idx_utilisateurs_statut ON utilisateurs(statut);
    `);
    console.log('✅ Table utilisateurs prête');

    // ============================================================
    // TABLE REGIONS
    // ============================================================
    await pool.query(`
    CREATE TABLE IF NOT EXISTS regions (
      id SERIAL PRIMARY KEY,
      nom VARCHAR(100) NOT NULL UNIQUE,
      telephone VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    console.log('✅ Table regions prête');

    // ============================================================
    // TABLE COMPTEURS DOSSIERS UTILISATEURS
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS compteurs_dossiers_utilisateurs (
        id SERIAL PRIMARY KEY,
        utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        annee INTEGER NOT NULL,
        compteur INTEGER DEFAULT 0,
        type_usager VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(utilisateur_id, annee, type_usager)
      )
    `);
    console.log('✅ Table compteurs_dossiers_utilisateurs prête');

    // ============================================================
    // TABLE NOTIFICATIONS
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        usager_id INTEGER,
        read BOOLEAN DEFAULT FALSE,
        created_by INTEGER REFERENCES utilisateurs(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table notifications prête');

    // ============================================================
    // TABLE DELETE_REQUESTS
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delete_requests (
        id SERIAL PRIMARY KEY,
        usager_id INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_by INTEGER REFERENCES utilisateurs(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table delete_requests prête');

    // ============================================================
    // TABLE DELETE_CONFIRMATIONS
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delete_confirmations (
        id SERIAL PRIMARY KEY,
        request_id INTEGER NOT NULL REFERENCES delete_requests(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        user_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(request_id, user_id)
      )
    `);
    console.log('✅ Table delete_confirmations prête');

    // ============================================================
    // TABLE DELETE_HISTORY
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delete_history (
        id SERIAL PRIMARY KEY,
        usager_nom VARCHAR(200) NOT NULL,
        usager_type VARCHAR(50) NOT NULL,
        deleted_by VARCHAR(100) NOT NULL,
        deleted_by_role VARCHAR(50) DEFAULT 'super_admin',
        user_id INTEGER,
        created_by INTEGER REFERENCES utilisateurs(id),
        details JSONB,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table delete_history prête');

    // ============================================================
    // TABLE ACTIVITES
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activites (
        id SERIAL PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        user_id INTEGER,
        created_by INTEGER REFERENCES utilisateurs(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table activites prête');

    // ============================================================
    // TABLE USAGERS_VUS
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usagers_vus (
        id SERIAL PRIMARY KEY,
        usager_id INTEGER NOT NULL,
        usager_type VARCHAR(50) NOT NULL,
        vu_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(usager_id, usager_type)
      )
    `);
    console.log('✅ Table usagers_vus prête');

    // ============================================================
    // TABLE ARTISTES
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS artistes (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100),
        nationalite VARCHAR(50),
        role VARCHAR(100),
        biographie TEXT,
        created_by INTEGER REFERENCES utilisateurs(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table artistes prête');

    // ============================================================
    // TABLE PAIEMENTS
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS paiements (
        id SERIAL PRIMARY KEY,
        usager_id INTEGER NOT NULL,
        usager_type VARCHAR(50) NOT NULL,
        type_paiement VARCHAR(20) NOT NULL,
        annee INTEGER,
        mois INTEGER CHECK (mois BETWEEN 1 AND 12),
        montant DECIMAL(15,2) NOT NULL,
        date_paiement DATE NOT NULL,
        frais_dossier DECIMAL(15,2) DEFAULT 0,
        montant_retard DECIMAL(15,2) DEFAULT 0,
        est_retard BOOLEAN DEFAULT FALSE,
        reference VARCHAR(100),
        statut VARCHAR(20) DEFAULT 'paye',
        created_by INTEGER REFERENCES utilisateurs(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT check_paiement CHECK (
          (type_paiement = 'mensuel' AND annee IS NOT NULL AND mois IS NOT NULL) OR
          (type_paiement = 'unique' AND annee IS NULL AND mois IS NULL)
        )
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_paiements_usager ON paiements(usager_id, usager_type);
      CREATE INDEX IF NOT EXISTS idx_paiements_date ON paiements(date_paiement);
      CREATE INDEX IF NOT EXISTS idx_paiements_annee ON paiements(annee);
    `);
    console.log('✅ Table paiements prête');

    // ============================================================
    // TABLE BACKUP_ANNUEL
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS backup_annuel (
        id SERIAL PRIMARY KEY,
        annee INTEGER NOT NULL UNIQUE,
        data JSONB NOT NULL,
        created_by INTEGER REFERENCES utilisateurs(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table backup_annuel prête');

    // ============================================================
    // TABLES DES USAGERS (6 types) AVEC created_by
    // ============================================================
    const tablesUsagers = [
      {
        name: 'usagers_hotel',
        columns: `demandeur VARCHAR(255), denomination VARCHAR(255), adresse_siege VARCHAR(255), nif_stat VARCHAR(100), telephone VARCHAR(50), email VARCHAR(255), etoiles VARCHAR(10), ravinala BOOLEAN DEFAULT FALSE, representant_nom VARCHAR(255), representant_adresse VARCHAR(255), representant_tel VARCHAR(50), representant_cin VARCHAR(100), representant_cin_delivree DATE, representant_cin_lieu VARCHAR(255), representant_fonction VARCHAR(255), activite VARCHAR(100), moyens_communication JSONB, total VARCHAR(50), a_compter_du DATE, echeance DATE, confirmation_nom VARCHAR(255), date_signature DATE, lieu_signature VARCHAR(255), type_paiement VARCHAR(50) DEFAULT 'mensuel', montant_mensuel DECIMAL(15,2) DEFAULT 0, frais_dossier DECIMAL(15,2) DEFAULT 0, region VARCHAR(100), uniter INTEGER DEFAULT 1, numero_dossier_utilisateur VARCHAR(50), created_by INTEGER REFERENCES utilisateurs(id), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
      },
      {
        name: 'usagers_magasin',
        columns: `demandeur VARCHAR(255), denomination VARCHAR(255), adresse_siege VARCHAR(255), nif_stat VARCHAR(100), telephone VARCHAR(50), representant_nom VARCHAR(255), representant_adresse VARCHAR(255), representant_tel VARCHAR(50), representant_cin VARCHAR(100), representant_cin_delivree DATE, representant_cin_lieu VARCHAR(255), representant_fonction VARCHAR(255), activite VARCHAR(255), nombre_magasins INTEGER DEFAULT 0, moyens_communication JSONB, total VARCHAR(50), a_compter_du DATE, echeance DATE, confirmation_nom VARCHAR(255), date_signature DATE, lieu_signature VARCHAR(255), type_paiement VARCHAR(50) DEFAULT 'mensuel', montant_mensuel DECIMAL(15,2) DEFAULT 0, frais_dossier DECIMAL(15,2) DEFAULT 0, region VARCHAR(100), uniter INTEGER DEFAULT 1, numero_dossier_utilisateur VARCHAR(50), created_by INTEGER REFERENCES utilisateurs(id), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
      },
      {
        name: 'usagers_media',
        columns: `proprietaire_nom VARCHAR(255), proprietaire_adresse VARCHAR(255), proprietaire_tel VARCHAR(50), proprietaire_cin VARCHAR(100), proprietaire_cin_delivree DATE, proprietaire_cin_lieu VARCHAR(255), representant_nom VARCHAR(255), representant_adresse VARCHAR(255), representant_tel VARCHAR(50), representant_cin VARCHAR(100), representant_cin_delivree DATE, representant_cin_lieu VARCHAR(255), representant_pouvoir_date DATE, representant_pouvoir_par VARCHAR(255), representant_fonction VARCHAR(255), denomination VARCHAR(255), frequence VARCHAR(50), canal VARCHAR(50), siege VARCHAR(255), telephone VARCHAR(50), email VARCHAR(255), nif VARCHAR(100), stat VARCHAR(100), taux DECIMAL(15,2), couverture_capitale BOOLEAN DEFAULT FALSE, couverture_chef_lieu_province BOOLEAN DEFAULT FALSE, couverture_chef_lieu_region BOOLEAN DEFAULT FALSE, couverture_district BOOLEAN DEFAULT FALSE, horaires_jusqua12 BOOLEAN DEFAULT FALSE, horaires_13a24 BOOLEAN DEFAULT FALSE, has_regions BOOLEAN DEFAULT FALSE, regions_detail JSONB, type_paiement VARCHAR(50) DEFAULT 'mensuel', montant_mensuel DECIMAL(15,2) DEFAULT 0, frais_dossier DECIMAL(15,2) DEFAULT 0, region VARCHAR(100), confirmation_nom VARCHAR(255), date_signature DATE, lieu_signature VARCHAR(255), uniter INTEGER DEFAULT 1, numero_dossier_utilisateur VARCHAR(50), created_by INTEGER REFERENCES utilisateurs(id), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
      },
      {
        // ✅ BUS - Avec a_compter_du ET echeance
        name: 'usagers_bus',
        columns: `demandeur VARCHAR(255), denomination VARCHAR(255), adresse_siege VARCHAR(255), nif_stat VARCHAR(100), telephone VARCHAR(50), email VARCHAR(255), representant_nom VARCHAR(255), representant_adresse VARCHAR(255), representant_tel VARCHAR(50), representant_cin VARCHAR(100), representant_cin_delivree DATE, representant_cin_lieu VARCHAR(255), representant_fonction VARCHAR(255), nombre_vehicules INTEGER DEFAULT 0, lignes VARCHAR(255), type_bus VARCHAR(50), trajet VARCHAR(255), horaires VARCHAR(255), zones_desservies VARCHAR(255), a_compter_du DATE, echeance DATE, type_paiement VARCHAR(50) DEFAULT 'mensuel', montant_mensuel DECIMAL(15,2) DEFAULT 0, frais_dossier DECIMAL(15,2) DEFAULT 0, region VARCHAR(100), confirmation_nom VARCHAR(255), date_signature DATE, lieu_signature VARCHAR(255), uniter INTEGER DEFAULT 1, numero_dossier_utilisateur VARCHAR(50), created_by INTEGER REFERENCES utilisateurs(id), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
      },
      {
        name: 'usagers_nightclub',
        columns: `demandeur VARCHAR(255), denomination VARCHAR(255), adresse_siege VARCHAR(255), nif_stat VARCHAR(100), telephone VARCHAR(50), email VARCHAR(255), representant_nom VARCHAR(255), representant_adresse VARCHAR(255), representant_tel VARCHAR(50), representant_cin VARCHAR(100), representant_cin_delivree DATE, representant_cin_lieu VARCHAR(255), representant_fonction VARCHAR(255), jauge_max INTEGER DEFAULT 0, horaires VARCHAR(255), moyens_communication JSONB, total VARCHAR(50), a_compter_du DATE, echeance DATE, type_paiement VARCHAR(50) DEFAULT 'mensuel', montant_mensuel DECIMAL(15,2) DEFAULT 0, frais_dossier DECIMAL(15,2) DEFAULT 0, region VARCHAR(100), confirmation_nom VARCHAR(255), date_signature DATE, lieu_signature VARCHAR(255), uniter INTEGER DEFAULT 1, numero_dossier_utilisateur VARCHAR(50), created_by INTEGER REFERENCES utilisateurs(id), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
      },
      {
        name: 'usagers_occasionnel',
        columns: `demandeur VARCHAR(255), denomination VARCHAR(255), adresse_siege VARCHAR(255), nif_stat VARCHAR(100), telephone VARCHAR(50), email VARCHAR(255), representant_nom VARCHAR(255), representant_adresse VARCHAR(255), representant_tel VARCHAR(50), representant_cin VARCHAR(100), representant_cin_delivree DATE, representant_cin_lieu VARCHAR(255), representant_fonction VARCHAR(255), organisateurs VARCHAR(255), representant_par VARCHAR(255), genre_manifestation VARCHAR(255), artistes VARCHAR(255), date_evenement DATE, lieu_evenement VARCHAR(255), adresse VARCHAR(255), domicile VARCHAR(255), confirmation_nom VARCHAR(255), date_signature DATE, lieu_ajout VARCHAR(255), frais_dossier DECIMAL(15,2) DEFAULT 0, date_ajout DATE, nom_evenement VARCHAR(255), numero_dossier_global VARCHAR(50), numero_dossier_utilisateur VARCHAR(50), region VARCHAR(100), uniter INTEGER DEFAULT 1, created_by INTEGER REFERENCES utilisateurs(id), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
      }
    ];

    // ❌ PAS DE DROP TABLE ICI - Suppression manuelle via SQL Shell

    for (const table of tablesUsagers) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${table.name} (
          id SERIAL PRIMARY KEY,
          ${table.columns}
        )
      `);
      console.log(`✅ Table ${table.name} prête`);
    }

    // ============================================================
    // TABLE EVENT_ARTISTES
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_artistes (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES usagers_occasionnel(id) ON DELETE CASCADE,
        artiste_id INTEGER NOT NULL REFERENCES artistes(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES utilisateurs(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, artiste_id)
      )
    `);
    console.log('✅ Table event_artistes prête');

    // ============================================================
    // TABLE USAGERS (générique)
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usagers (
        id SERIAL PRIMARY KEY,
        type_usager VARCHAR(50) NOT NULL,
        denomination VARCHAR(255),
        demandeur VARCHAR(255),
        telephone VARCHAR(50),
        email VARCHAR(255),
        region VARCHAR(100),
        adresse TEXT,
        frais_dossier DECIMAL(15,2) DEFAULT 0,
        montant_mensuel DECIMAL(15,2) DEFAULT 0,
        uniter INTEGER DEFAULT 1,
        created_by INTEGER REFERENCES utilisateurs(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table usagers prête');

// src/server/database.js
// ... (le reste du code existant)

    // ============================================================
    // TABLE FACTURE_USAGER
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS facture_usager (
        id SERIAL PRIMARY KEY,
        ref_omda INTEGER NOT NULL UNIQUE,
        num_facture VARCHAR(20) NOT NULL,
        num_facture_type VARCHAR(1) DEFAULT 'A',
        ref_client_type VARCHAR(10) NOT NULL,
        ref_usager INTEGER NOT NULL,
        type_facture VARCHAR(50),
        region_usager VARCHAR(100),
        date_ajout DATE DEFAULT CURRENT_DATE,
        
  
        denomination VARCHAR(255),
        demandeur VARCHAR(255),
        telephone VARCHAR(50),
        email VARCHAR(255),
        adresse TEXT,
        
      
        representant_nom VARCHAR(255),
        representant_adresse VARCHAR(255),
        representant_tel VARCHAR(50),
        representant_cin VARCHAR(100),
        representant_cin_delivree VARCHAR(50),
        representant_cin_lieu VARCHAR(255),
        representant_fonction VARCHAR(255),
        
     
        activite VARCHAR(255),
        etoiles VARCHAR(10),
        ravinala BOOLEAN DEFAULT FALSE,
        nombre_magasins INTEGER DEFAULT 0,
        nombre_vehicules INTEGER DEFAULT 0,
        lignes VARCHAR(255),
        type_bus VARCHAR(50),
        trajet VARCHAR(255),
        horaires VARCHAR(255),
        zones_desservies VARCHAR(255),
        jauge_max INTEGER DEFAULT 0,
        frequence VARCHAR(50),
        canal VARCHAR(50),
        siege VARCHAR(255),
        nif VARCHAR(100),
        stat VARCHAR(100),
        taux DECIMAL(15,2),
        
     
        organisateurs VARCHAR(255),
        representant_par VARCHAR(255),
        genre_manifestation VARCHAR(255),
        artistes VARCHAR(255),
        date_evenement DATE,
        lieu_evenement VARCHAR(255),
        domicile VARCHAR(255),
        lieu_ajout VARCHAR(255),
        date_signature DATE,
        confirmation_nom VARCHAR(255),
        
   
        moyens_communication JSONB,
        
    
        a_compter_du DATE,
        echeance DATE,
        
     
        montant_mensuel DECIMAL(15,2) DEFAULT 0,
        frais_dossier DECIMAL(15,2) DEFAULT 0,
        montant_retard DECIMAL(15,2) DEFAULT 0,
        is_retard BOOLEAN DEFAULT FALSE,
        soit_total DECIMAL(15,2) DEFAULT 0,
        uniter INTEGER DEFAULT 1,
        
  
        numero_dossier_utilisateur VARCHAR(50),
        numero_dossier_global VARCHAR(50),
        
    
        statut VARCHAR(20) DEFAULT 'brouillon',
        created_by INTEGER REFERENCES utilisateurs(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_facture_ref_omda ON facture_usager(ref_omda);
      CREATE INDEX IF NOT EXISTS idx_facture_ref_client_type ON facture_usager(ref_client_type);
      CREATE INDEX IF NOT EXISTS idx_facture_ref_usager ON facture_usager(ref_usager);
      CREATE INDEX IF NOT EXISTS idx_facture_statut ON facture_usager(statut);
    `);
    console.log('✅ Table facture_usager prête');

// ... (fin du fichier)

    // ============================================================
    // CRÉATION DES UTILISATEURS PAR DÉFAUT
    // ============================================================
    const defaultUsers = [
      { nom: 'Super Admin', email: 'superadmin@omda.mg', mot_de_passe: '1234', role: 'super_admin', prefix: 'SA' },
      { nom: 'Admin OMDA', email: 'admin@omda.mg', mot_de_passe: '1234', role: 'admin', prefix: 'AD' },
      { nom: 'DAF', email: 'daf@omda.mg', mot_de_passe: '5678', role: 'daf', prefix: 'DAF' },
      { nom: 'Jean Dupont', email: 'jean@omda.mg', mot_de_passe: '1234', role: 'user', prefix: 'JD' },
      { nom: 'Marie Claire', email: 'marie@omda.mg', mot_de_passe: '1234', role: 'user', prefix: 'MC' },
      { nom: 'Admin', email: 'Admin@gmail.com', mot_de_passe: '1234', role: 'super_admin', prefix: 'ADM' }
    ];

    const currentYear = new Date().getFullYear();
    const typesUsager = ['Hôtel', 'Grand Surface', 'Télé/Radio', 'Bus', 'Night club', 'OCC'];

    for (const user of defaultUsers) {
      const exists = await pool.query('SELECT id FROM utilisateurs WHERE email = $1', [user.email]);
      if (exists.rows.length === 0) {
        const result = await pool.query(
          `INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut, prefix) 
           VALUES ($1, $2, $3, $4, 'actif', $5) RETURNING id`,
          [user.nom, user.email, user.mot_de_passe, user.role, user.prefix]
        );
        const userId = result.rows[0].id;
        console.log(`✅ Utilisateur ${user.nom} (${user.role}) créé`);

        for (const type of typesUsager) {
          await pool.query(
            `INSERT INTO compteurs_dossiers_utilisateurs (utilisateur_id, annee, compteur, type_usager) 
             VALUES ($1, $2, 0, $3)
             ON CONFLICT (utilisateur_id, annee, type_usager) DO NOTHING`,
            [userId, currentYear, type]
          );
        }
      }
    }

    console.log('✅ Base de données initialisée avec succès !');
    console.log('📂 Schéma utilisé : omda_app');
    console.log('📌 Comptes par défaut:');
    console.log('   - superadmin@omda.mg / 1234 (Super Admin)');
    console.log('   - admin@omda.mg / 1234 (Admin)');
    console.log('   - daf@omda.mg / 5678 (DAF)');
    console.log('   - jean@omda.mg / 1234 (User)');
    console.log('   - marie@omda.mg / 1234 (User)');
    console.log('   - Admin@gmail.com / 1234 (Super Admin)');

  } catch (error) {
    console.error('❌ Erreur init DB:', error.message);
    console.error('📌 Détail complet:', error);
    throw error;
  }
}

// ============================================================
// FONCTION DE TEST DE CONNEXION
// ============================================================
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW() as time');
    console.log('✅ Test de connexion réussi:', result.rows[0].time);
    return true;
  } catch (error) {
    console.error('❌ Test de connexion échoué:', error.message);
    return false;
  }
}

// ============================================================
// EXPORT
// ============================================================
module.exports = {
  pool,
  initDB,
  testConnection,
  query: (text, params) => pool.query(text, params)
};