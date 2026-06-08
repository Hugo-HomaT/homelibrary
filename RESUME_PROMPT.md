# Prompt de reprise — Homa Asset Library

> Copie-colle le bloc ci-dessous dans une nouvelle session Claude Code (ouverte dans
> `C:\Users\hugod\Desktop\Airbnb`) pour reprendre le projet là où on s'est arrêté.

---

Tu reprends le développement de **Homa Asset Library**, un outil web **interne** à Homa Games pour
parcourir, prévisualiser et gérer des **assets 3D et des textures** destinés aux playable ads.
(Le dossier s'appelle `Airbnb` et le package `airbnb-clone` pour des raisons historiques — le projet a
démarré comme un clone visuel d'Airbnb avant de pivoter. Le produit s'appelle **Homa Asset Library**.)

**Avant tout : lis `CLAUDE.md` à la racine** — il décrit l'archi, les conventions et les règles produit.

Stack : React 18 + Vite + three.js / react-three-fiber / drei, CSS simple (`src/index.css`).
Lancer : `npm run dev` (port 5173). Config preview : `.claude/launch.json` → `airbnb-dev`.

### État actuel (fonctionnel et vérifié)
- Grille d'assets avec recherche live, filtres (catégorie, type 3D/Texture), tri.
- Cards épurées (nom + specs techniques + formats + taille) ; aperçu 3D au survol (modèles),
  swatch canvas (textures procédurales) ou `<img>` (textures uploadées).
- Modale détail : viewer 3D (orbite/zoom) avec **modes d'affichage Shaded / Wire / Shaded+wire**,
  aperçu texture 3D (sphère/cube/cylindre) + tiling + maps PBR (pour les textures procédurales).
- **Sélection** (panier) + export de pack ; favoris (bookmarks) ; toasts.
- **Upload réel** (bouton « New asset ») : dropzone multi-fichiers, **détection auto** du type /
  format / résolution (pixels réels) / tris (parsing GLTF·OBJ·FBX via three.js), **aperçu interactif**
  de l'asset uploadé, champs Nom + Description + Catégorie, **garde-fou anti-doublon** (nom déjà pris).
- 30 assets de démo **procéduraux** (générés) ; les uploads sont de **vrais fichiers**.

### Règles produit à respecter (le client y tient)
- Interne, **épuré**, **100% anglais** dans l'UI.
- ❌ Pas de notes/avis, pas de compteurs de téléchargement, pas de « PRO », pas de prix/marketing.
- ✅ L'upload doit rester un vrai flux de prod : vrais fichiers, métadonnées auto-détectées, dédup.
  Ne jamais revenir à une création « jouet » (choisir une couleur/un pattern à la main).

### Points ouverts (à confirmer avec l'utilisateur avant de coder)
1. Garder les 30 assets de démo procéduraux, ou vider la bibliothèque pour ne montrer que les vrais uploads ?
2. **Persistance** des uploads (actuellement en mémoire, perdus au reload) : localStorage / IndexedDB / backend ?
3. Export `.zip` réel du pack (aujourd'hui simulé via un toast).
4. Renommer dossier/package `airbnb*` → `homa-asset-library` ?
5. Miniatures pré-rendues pour les modèles uploadés (afficher sans survol) ; gestion des textures
   externes des FBX/GLB ; tags multiples + recherche par tag.

### Conseils de vérification
- L'outil `preview_screenshot` devient instable avec les canvases WebGL en rotation continue
  (timeouts). Vérifie plutôt l'état via `preview_eval` (assertions DOM) + `preview_console_logs`,
  et redémarre le serveur preview pour un renderer frais si besoin d'une capture.
- Pour piloter les inputs React depuis `preview_eval` : utiliser le setter natif de `value` +
  `dispatchEvent(new Event('input',{bubbles:true}))`, et **relire l'état dans un eval séparé**.

Commence par lire `CLAUDE.md`, lancer l'app, puis demande-moi quelle tâche tu attaques en premier.

---
