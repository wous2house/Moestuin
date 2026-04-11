# Instructies
Toon na elke aanpassing, toevoeging, of fix welke files zijn aangepast zodat ik weet of ik een npm install moet doen of niet

## Versie nummer
Verhoog het versienummer van de app incrementeel na elke fix, aanpassing of toevoeging (of wat dan ook). Een honderste omhoog na een kleine fix, een tiende na een nieuwe functie of een hele na een hele nieuwe versie.
Zorg er ALTIJD voor dat je bij een versie-verhoging in `package.json` ook de hardcoded versie in `src/pages/Login.tsx` (bij de versie-fallback onderaan het bestand) aanpast naar hetzelfde nummer.