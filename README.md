# Indikace léků

Česká pomůcka pro ordinaci praktického lékaře: Forxiga, Trajenta a Jentadueto. Odděleně vyhodnocuje indikaci dle SPC, bezpečnost, podmínky úhrady a předpis praktikem.

## Spuštění

Otevřete `index.html` v prohlížeči. Web je samostatný, bez instalace a bez externích závislostí. Údaje z formuláře se neukládají ani neodesílají.

## GitHub Pages

V nastavení repozitáře v sekci Pages zvolte „Deploy from a branch“, větev `main`, složku `/ (root)` a uložte. Web funguje i v podadresáři repozitáře; jednotlivé léky používají odkazy `#/forxiga/`, `#/trajenta/` a `#/jentadueto/`.

## Platnost a omezení

Úhrady vycházejí z číselníků SÚKL k 1. 10. 2026, SPC bylo kontrolováno 15. 10. 2026. Pravidla se neaktualizují automaticky. Jde o podpůrnou pomůcku, nikoli klinicky certifikovaný rozhodovací systém. Konečné posouzení vyžaduje lékaře a kontrolu aktuálního SPC, úhradových pravidel i stavu pacienta.

## Kontroly

`node test.cjs` spouští 32 kontrol hraničních hodnot a chybějících údajů. `rules.js` je samostatná kopie pravidel pro testy; publikovaný `index.html` obsahuje stejná pravidla vložená přímo. Při aktualizaci udržujte obě verze shodné.
