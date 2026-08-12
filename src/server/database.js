const { Pool } = require('pg');

const pool = new Pool({
  user: 'omda_user',
  password: 'Omda2026',
  host: 'localhost',
  port: 5432,
  database: 'omda_db'
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erreur de connexion à PostgreSQL:', err.stack);
  } else {
    console.log('✅ Connecté à PostgreSQL');
    release();
  }
});

async function initDB() {
  try {
    console.log('🔍 Initialisation de la base de données...');

    // ============================================================
    // TABLE UTILISATEURS
    // ============================================================
    await pool.query(`CREATE TABLE IF NOT EXISTS utilisateurs (
      id SERIAL PRIMARY KEY, 
      nom VARCHAR(100) NOT NULL, 
      email VARCHAR(100) UNIQUE NOT NULL, 
      mot_de_passe VARCHAR(255) NOT NULL, 
      role VARCHAR(20) DEFAULT 'user', 
      statut VARCHAR(20) DEFAULT 'actif', 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
      derniere_connexion TIMESTAMP
    )`);
    console.log('✅ Table utilisateurs prête');

    // ============================================================
    // TABLE REGIONS
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS regions (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(100) NOT NULL UNIQUE,
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
    await pool.query(`CREATE TABLE IF NOT EXISTS artistes (
      id SERIAL PRIMARY KEY, 
      nom VARCHAR(100) NOT NULL, 
      prenom VARCHAR(100), 
      nationalite VARCHAR(50), 
      role VARCHAR(100), 
      biographie TEXT, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    console.log('✅ Table artistes prête');

    // ============================================================
    // TABLE PAIEMENTS (UNIQUE - REMPLACE TOUTES LES ANCIENNES)
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT check_paiement CHECK (
        (type_paiement = 'mensuel' AND annee IS NOT NULL AND mois IS NOT NULL) OR
        (type_paiement = 'unique' AND annee IS NULL AND mois IS NULL)
      )
    )
  `);
    console.log('✅ Table paiements créée');

    // INDEX POUR PAIEMENTS
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_paiements_usager ON paiements(usager_id, usager_type);
      CREATE INDEX IF NOT EXISTS idx_paiements_date ON paiements(date_paiement);
      CREATE INDEX IF NOT EXISTS idx_paiements_annee ON paiements(annee);
    `);
    console.log('✅ Index paiements prêts');

    // DROITS POUR PAIEMENTS
    await pool.query(`ALTER TABLE paiements OWNER TO omda_user`);
    await pool.query(`GRANT ALL PRIVILEGES ON TABLE paiements TO omda_user`);
    await pool.query(`GRANT ALL PRIVILEGES ON SEQUENCE paiements_id_seq TO omda_user`);
    console.log('✅ Droits paiements accordés à omda_user');

    // ============================================================
    // TABLE BACKUP_ANNUEL
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS backup_annuel (
        id SERIAL PRIMARY KEY,
        annee INTEGER NOT NULL UNIQUE,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table backup_annuel prête');

    // ============================================================
    // TABLE USAGERS_HOTEL (AJOUT numero_dossier_utilisateur)
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usagers_hotel (
        id SERIAL PRIMARY KEY,
        demandeur VARCHAR(255),
        denomination VARCHAR(255),
        adresse_siege VARCHAR(255),
        nif_stat VARCHAR(100),
        telephone VARCHAR(50),
        email VARCHAR(255),
        etoiles VARCHAR(10),
        ravinala BOOLEAN DEFAULT FALSE,
        representant_nom VARCHAR(255),
        representant_adresse VARCHAR(255),
        representant_tel VARCHAR(50),
        representant_cin VARCHAR(100),
        representant_cin_delivree DATE,
        representant_cin_lieu VARCHAR(255),
        representant_fonction VARCHAR(255),
        activite VARCHAR(100),
        moyens_communication JSONB,
        total VARCHAR(50),
        a_compter_du DATE,
        echeance DATE,
        confirmation_nom VARCHAR(255),
        date_signature DATE,
        lieu_signature VARCHAR(255),
        type_paiement VARCHAR(50) DEFAULT 'mensuel',
        montant_mensuel DECIMAL(15,2) DEFAULT 0,
        frais_dossier DECIMAL(15,2) DEFAULT 0,
        region VARCHAR(100),
        uniter INTEGER DEFAULT 1,
        numero_dossier_utilisateur VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table usagers_hotel prête');

    // ============================================================
    // TABLE USAGERS_MAGASIN (AJOUT numero_dossier_utilisateur)
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usagers_magasin (
        id SERIAL PRIMARY KEY,
        demandeur VARCHAR(255),
        denomination VARCHAR(255),
        adresse_siege VARCHAR(255),
        nif_stat VARCHAR(100),
        telephone VARCHAR(50),
        representant_nom VARCHAR(255),
        representant_adresse VARCHAR(255),
        representant_tel VARCHAR(50),
        representant_cin VARCHAR(100),
        representant_cin_delivree DATE,
        representant_cin_lieu VARCHAR(255),
        representant_fonction VARCHAR(255),
        activite VARCHAR(255),
        nombre_magasins INTEGER DEFAULT 0,
        moyens_communication JSONB,
        total VARCHAR(50),
        a_compter_du DATE,
        echeance DATE,
        confirmation_nom VARCHAR(255),
        date_signature DATE,
        lieu_signature VARCHAR(255),
        type_paiement VARCHAR(50) DEFAULT 'mensuel',
        montant_mensuel DECIMAL(15,2) DEFAULT 0,
        frais_dossier DECIMAL(15,2) DEFAULT 0,
        region VARCHAR(100),
        uniter INTEGER DEFAULT 1,
        numero_dossier_utilisateur VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table usagers_magasin prête');

    // ============================================================
    // TABLE USAGERS_MEDIA (AJOUT numero_dossier_utilisateur)
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usagers_media (
        id SERIAL PRIMARY KEY,
        proprietaire_nom VARCHAR(255),
        proprietaire_adresse VARCHAR(255),
        proprietaire_tel VARCHAR(50),
        proprietaire_cin VARCHAR(100),
        proprietaire_cin_delivree DATE,
        proprietaire_cin_lieu VARCHAR(255),
        representant_nom VARCHAR(255),
        representant_adresse VARCHAR(255),
        representant_tel VARCHAR(50),
        representant_cin VARCHAR(100),
        representant_cin_delivree DATE,
        representant_cin_lieu VARCHAR(255),
        representant_pouvoir_date DATE,
        representant_pouvoir_par VARCHAR(255),
        representant_fonction VARCHAR(255),
        denomination VARCHAR(255),
        frequence VARCHAR(50),
        canal VARCHAR(50),
        siege VARCHAR(255),
        telephone VARCHAR(50),
        email VARCHAR(255),
        nif VARCHAR(100),
        stat VARCHAR(100),
        taux DECIMAL(15,2),
        couverture_capitale BOOLEAN DEFAULT FALSE,
        couverture_chef_lieu_province BOOLEAN DEFAULT FALSE,
        couverture_chef_lieu_region BOOLEAN DEFAULT FALSE,
        couverture_district BOOLEAN DEFAULT FALSE,
        horaires_jusqua12 BOOLEAN DEFAULT FALSE,
        horaires_13a24 BOOLEAN DEFAULT FALSE,
        has_regions BOOLEAN DEFAULT FALSE,
        regions_detail JSONB,
        type_paiement VARCHAR(50) DEFAULT 'mensuel',
        montant_mensuel DECIMAL(15,2) DEFAULT 0,
        frais_dossier DECIMAL(15,2) DEFAULT 0,
        region VARCHAR(100),
        confirmation_nom VARCHAR(255),
        date_signature DATE,
        lieu_signature VARCHAR(255),
        uniter INTEGER DEFAULT 1,
        numero_dossier_utilisateur VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table usagers_media prête');

    // ============================================================
    // TABLE USAGERS_BUS (AJOUT numero_dossier_utilisateur)
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usagers_bus (
        id SERIAL PRIMARY KEY,
        demandeur VARCHAR(255),
        denomination VARCHAR(255),
        adresse_siege VARCHAR(255),
        nif_stat VARCHAR(100),
        telephone VARCHAR(50),
        email VARCHAR(255),
        representant_nom VARCHAR(255),
        representant_adresse VARCHAR(255),
        representant_tel VARCHAR(50),
        representant_cin VARCHAR(100),
        representant_cin_delivree DATE,
        representant_cin_lieu VARCHAR(255),
        representant_fonction VARCHAR(255),
        nombre_vehicules INTEGER DEFAULT 0,
        lignes VARCHAR(255),
        type_bus VARCHAR(50),
        trajet VARCHAR(255),
        horaires VARCHAR(255),
        zones_desservies VARCHAR(255),
        type_paiement VARCHAR(50) DEFAULT 'mensuel',
        montant_mensuel DECIMAL(15,2) DEFAULT 0,
        frais_dossier DECIMAL(15,2) DEFAULT 0,
        region VARCHAR(100),
        confirmation_nom VARCHAR(255),
        date_signature DATE,
        lieu_signature VARCHAR(255),
        uniter INTEGER DEFAULT 1,
        numero_dossier_utilisateur VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table usagers_bus prête');

    // ============================================================
    // TABLE USAGERS_NIGHTCLUB (AJOUT numero_dossier_utilisateur)
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usagers_nightclub (
        id SERIAL PRIMARY KEY,
        demandeur VARCHAR(255),
        denomination VARCHAR(255),
        adresse_siege VARCHAR(255),
        nif_stat VARCHAR(100),
        telephone VARCHAR(50),
        email VARCHAR(255),
        representant_nom VARCHAR(255),
        representant_adresse VARCHAR(255),
        representant_tel VARCHAR(50),
        representant_cin VARCHAR(100),
        representant_cin_delivree DATE,
        representant_cin_lieu VARCHAR(255),
        representant_fonction VARCHAR(255),
        jauge_max INTEGER DEFAULT 0,
        horaires VARCHAR(255),
        moyens_communication JSONB,
        total VARCHAR(50),
        a_compter_du DATE,
        echeance DATE,
        type_paiement VARCHAR(50) DEFAULT 'mensuel',
        montant_mensuel DECIMAL(15,2) DEFAULT 0,
        frais_dossier DECIMAL(15,2) DEFAULT 0,
        region VARCHAR(100),
        confirmation_nom VARCHAR(255),
        date_signature DATE,
        lieu_signature VARCHAR(255),
        uniter INTEGER DEFAULT 1,
        numero_dossier_utilisateur VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table usagers_nightclub prête');

    // ============================================================
    // TABLE USAGERS_OCCASIONNEL (déjà avec numero_dossier_utilisateur)
    // ============================================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usagers_occasionnel (
        id SERIAL PRIMARY KEY,
        demandeur VARCHAR(255),
        denomination VARCHAR(255),
        adresse_siege VARCHAR(255),
        nif_stat VARCHAR(100),
        telephone VARCHAR(50),
        email VARCHAR(255),
        representant_nom VARCHAR(255),
        representant_adresse VARCHAR(255),
        representant_tel VARCHAR(50),
        representant_cin VARCHAR(100),
        representant_cin_delivree DATE,
        representant_cin_lieu VARCHAR(255),
        representant_fonction VARCHAR(255),
        organisateurs VARCHAR(255),
        representant_par VARCHAR(255),
        genre_manifestation VARCHAR(255),
        artistes VARCHAR(255),
        date_evenement DATE,
        lieu_evenement VARCHAR(255),
        adresse VARCHAR(255),
        domicile VARCHAR(255),
        confirmation_nom VARCHAR(255),
        date_signature DATE,
        lieu_ajout VARCHAR(255),
        frais_dossier DECIMAL(15,2) DEFAULT 0,
        date_ajout DATE,
        nom_evenement VARCHAR(255),
        numero_dossier_global VARCHAR(50),
        numero_dossier_utilisateur VARCHAR(50),
        region VARCHAR(100),
        uniter INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table usagers_occasionnel prête');

    // ============================================================
    // TABLE EVENT_ARTISTES
    // (déplacée ici : elle référence artistes ET usagers_occasionnel,
    //  qui doivent donc déjà exister)
    // ============================================================
    await pool.query(`CREATE TABLE IF NOT EXISTS event_artistes (
      id SERIAL PRIMARY KEY, 
      event_id INTEGER NOT NULL REFERENCES usagers_occasionnel(id) ON DELETE CASCADE, 
      artiste_id INTEGER NOT NULL REFERENCES artistes(id) ON DELETE CASCADE, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
      UNIQUE(event_id, artiste_id))`);
    console.log('✅ Table event_artistes prête');

    // ============================================================
    // CRÉATION DES UTILISATEURS PAR DÉFAUT
    // ============================================================
    const usersList = [
      { nom: 'ANDRIAMAMONJY', email: 'andria@omda.mg', mot_de_passe: '1234', role: 'user' },
      { nom: 'RAKOTOARISOA', email: 'rakoto@omda.mg', mot_de_passe: '1234', role: 'user' },
      { nom: 'BERANTO', email: 'beranto@omda.mg', mot_de_passe: '1234', role: 'user' }
    ];
    
    const currentYear = new Date().getFullYear();
    const typesUsager = ['Hôtel', 'Grand Surface', 'Télé/Radio', 'Bus', 'Night club', 'OCC'];
    
    for (const user of usersList) {
      const exists = await pool.query("SELECT * FROM utilisateurs WHERE email = $1", [user.email]);
      if (exists.rows.length === 0) {
        const result = await pool.query(
          `INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut) 
           VALUES ($1, $2, $3, $4, 'actif') RETURNING id`,
          [user.nom, user.email, user.mot_de_passe, user.role]
        );
        const userId = result.rows[0].id;
        console.log(`✅ Utilisateur ${user.nom} créé`);
        for (const type of typesUsager) {
          await pool.query(
            `INSERT INTO compteurs_dossiers_utilisateurs (utilisateur_id, annee, compteur, type_usager) 
             VALUES ($1, $2, 0, $3)`,
            [userId, currentYear, type]
          );
        }
      }
    }
    
    // ============================================================
    // SUPER ADMIN
    // ============================================================
    const superAdminCheck = await pool.query("SELECT * FROM utilisateurs WHERE role = 'super_admin'");
    if (superAdminCheck.rows.length === 0) {
      const result = await pool.query(`
        INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut) 
        VALUES ('Super Administrateur', 'superadmin@omda.mg', '1234', 'super_admin', 'actif') 
        RETURNING id
      `);
      const superAdminId = result.rows[0].id;
      for (const type of typesUsager) {
        await pool.query(
          `INSERT INTO compteurs_dossiers_utilisateurs (utilisateur_id, annee, compteur, type_usager) 
           VALUES ($1, $2, 0, $3)`,
          [superAdminId, currentYear, type]
        );
      }
      console.log('✅ Super Administrateur créé');
    }
    
    // ============================================================
    // DAF
    // ============================================================
    const dafCheck = await pool.query("SELECT * FROM utilisateurs WHERE role = 'daf'");
    if (dafCheck.rows.length === 0) {
      const result = await pool.query(`
        INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut) 
        VALUES ('Directeur Financier', 'daf@omda.mg', '5678', 'daf', 'actif') 
        RETURNING id
      `);
      const dafId = result.rows[0].id;
      for (const type of typesUsager) {
        await pool.query(
          `INSERT INTO compteurs_dossiers_utilisateurs (utilisateur_id, annee, compteur, type_usager) 
           VALUES ($1, $2, 0, $3)`,
          [dafId, currentYear, type]
        );
      }
      console.log('✅ DAF créé avec mot de passe: 5678');
    }
    
    console.log('✅ Base de données initialisée avec succès !');
  } catch (error) {
    console.error('❌ Erreur init DB:', error.message);
    console.error('Détail complet:', error);
  }
}

module.exports = {
  pool,
  initDB,
  query: (text, params) => pool.query(text, params)
};