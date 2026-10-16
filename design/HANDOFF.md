# Masjid Energie — brief d'intégration (landing page)

Ce dossier contient la maquette validée dans Claude Design. Objectif : la reproduire fidèlement en vrai site, prêt à déployer.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `design/maquette.html` | La maquette autonome. S'ouvre dans un navigateur, sert de **référence visuelle** (ne pas la réutiliser telle quelle : c'est un bundle compressé). |
| `design/source-maquette.html` | Le **code source lisible** de la maquette : structure, textes, styles inline, et la logique (classe `Component` en bas). Source de vérité pour les textes, couleurs, espacements. |
| `design/assets/hero.jpg` | Photo du hero (crédit : Jonathan Takle / Unsplash — à garder en mention). |
| `design/assets/logo-color.svg` / `logo-gold.svg` / `logo-white.svg` | Logo (pictogramme) en 3 variantes. `color` dans le header, `gold` dans le footer. |

## Notes sur le format de la maquette

`source-maquette.html` utilise des balises propres à Claude Design, à traduire en code standard :
- `{{ ... }}` = valeurs calculées par la classe `Component` (`renderVals()`).
- `<sc-for list=... as=...>` = boucle (map), `<sc-if value=...>` = condition.
- `sc-camel-on-click` = `onClick`, `sc-camel-view-box` = `viewBox`, `style-hover` = styles au survol.
- `<image-slot>` = emplacement d'image (`placeholder` = description de l'image attendue).
- `<dc-import name="Masjid Energie Logo Mark" variant=...>` = le logo → utiliser `assets/logo-<variant>.svg`.

## Identité visuelle

- **Polices** : Figtree (texte, 400–800), Montserrat (wordmark « Masjid Energie », 400/600/700). Google Fonts.
- **Couleurs** :
  - Vert principal `#0e5c47` (hover `#0b4a39`), vert foncé footer `#0a3d2e`
  - Or `#c8a24c`, dégradé titre `#d6a94e → #b08431`
  - Texte `#1d2a26`, texte secondaire `#55605c`, texte clair sur vert `#dfe9e4`
  - Bordures `#ebe9e3`, fond hero `#f3ede2`, vert vif accent `#2fbf72`
- Largeur max du contenu : 1536px ; marges latérales `clamp(20px, 5–7vw, 88–108px)`.

## Sections (dans l'ordre)

1. **Header / navigation** (`#accueil`) — logo + wordmark + « YGB DÉVELOPPEMENT », menu 7 liens, bouton « Demander une étude », bouton mode sombre. Menu burger sous 1240px.
2. **Hero** — photo plein cadre + dégradés, titre « L'énergie solaire au service des mosquées de France », 3 CTA (étude gratuite, découvrir la solution, voir la vidéo), cartes chiffres (70 %, 100 % renouvelable, A à Z, expertise).
3. **Notre accompagnement** (`#accompagnement`) — 5 étapes avec icônes et chevrons (chevrons masqués sous 1100px).
4. **Pourquoi nous** (`#pourquoi`) — 4 bénéfices.
5. **Nos réalisations** (`#realisations`) — 3 photos (emplacements vides pour l'instant).
6. **Partenaires · À propos** (`#partenaires`) — SunLib + 4 chiffres (800, 400+, 25 M€, 24h/24).
7. **Contact** (`#contact`) — fond vert, téléphone, e-mail, bouton « Appeler maintenant ».
8. **Footer** — logo or, mentions.

## Points à régler pendant l'intégration

- Le lien de menu « À propos » pointe vers `#a-propos`, qui n'existe pas → le faire pointer vers `#partenaires` (ou créer une ancre).
- Les boutons **mode sombre** et **Voir notre vidéo** ne font rien dans la maquette → les implémenter (ou me demander).
- Les 3 photos « Nos réalisations » sont à fournir → mettre des placeholders propres.
- L'onglet actif du menu doit suivre le scroll (IntersectionObserver), pas seulement le clic.
- « Mentions légales » : prévoir une page.
- Retirer tout badge/branding Claude Design s'il apparaît.
