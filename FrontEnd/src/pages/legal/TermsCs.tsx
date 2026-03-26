import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buildLocalizedPath } from '../../utils/localeRouting';

export function TermsCs() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  return (
    <>
      <h1>Podmínky použití</h1>
      <p className="last-updated">Naposledy aktualizováno: 16. prosince 2025</p>

      <section>
        <h2>1. Přijetí podmínek</h2>
        <p>
          Přístupem k aplikaci World Quiz (dále jen „Služba“) a jejím používáním přijímáte tyto Podmínky použití a souhlasíte s tím, že jimi budete vázáni. Pokud s těmito podmínkami nesouhlasíte, nepoužívejte prosím tuto Službu.
        </p>
      </section>

      <section>
        <h2>2. Popis Služby</h2>
        <p>
          World Quiz je vzdělávací geografická kvízová platforma, která poskytuje:
        </p>
        <ul>
          <li>Interaktivní geografické kvízy založené na mapě</li>
          <li>Hry s přiřazováním karet s vlajkami a tvary států</li>
          <li>Komplexní encyklopedii zemí s aktuálními daty</li>
          <li>Globální žebříčky a sledování skóre</li>
        </ul>
        <p>
          Služba je poskytována „tak, jak je“, bez jakýchkoli záruk, ať už výslovných nebo předpokládaných.
        </p>
      </section>

      <section>
        <h2>3. Uživatelské účty</h2>

        <h3>3.1 Vytvoření účtu</h3>
        <p>Pro přístup k určitým funkcím si musíte vytvořit účet poskytnutím:</p>
        <ul>
          <li>Platné e-mailové adresy</li>
          <li>Jedinečného uživatelského jména (přezdívky)</li>
          <li>Bezpečného hesla (při registraci pomocí e-mailu/hesla)</li>
        </ul>
        <p>
          Případně se můžete přihlásit pomocí autentizace Google OAuth 2.0.
        </p>

        <h3>3.2 Odpovědnost za účet</h3>
        <p>Jste zodpovědní za:</p>
        <ul>
          <li>Zachování důvěrnosti vašich přihlašovacích údajů</li>
          <li>Veškeré aktivity, které se pod vaším účtem uskuteční</li>
          <li>Okamžité upozornění na jakékoli neoprávněné použití vašeho účtu</li>
        </ul>

        <h3>3.3 Ověření účtu</h3>
        <p>
          Účty vytvořené pomocí e-mailu a hesla vyžadují ověření e-mailu do 1 hodiny od registrace. Neověřené účty budou automaticky smazány.
        </p>
      </section>

      <section>
        <h2>4. Přijatelné použití</h2>
        <p>Souhlasíte s tím, že NEBUDETE:</p>
        <ul>
          <li>Používat Službu k jakémukoli nezákonnému účelu</li>
          <li>Pokoušet se získat neoprávněný přístup ke Službě nebo k účtům jiných uživatelů</li>
          <li>Zpětně analyzovat (reverse engineer), dekompilovat nebo rozebírat jakoukoli část Služby</li>
          <li>Používat automatizované skripty nebo boty k manipulaci se skóre nebo žebříčky</li>
          <li>Nahrávat nebo přenášet viry, malware nebo jakýkoli jiný škodlivý kód</li>
          <li>Obtěžovat, zneužívat nebo poškozovat ostatní uživatele</li>
          <li>Vydávat se za jinou osobu nebo subjekt</li>
          <li>Používat urážlivá nebo nevhodná uživatelská jména</li>
        </ul>
      </section>

      <section>
        <h2>5. Duševní vlastnictví</h2>
        <p>
          Veškerý obsah, funkce a vlastnosti Služby World Quiz, včetně (mimo jiné) textu, grafiky, log, ikon a softwaru, jsou majetkem poskytovatele Služby a jsou chráněny mezinárodními zákony o autorských právech, ochranných známkách a dalších zákonech o duševním vlastnictví.
        </p>
        <p>
          Služba je licencována pod licencí MIT pro open-source kód. Značka World Quiz, design a uživatelsky generovaný obsah však zůstávají vlastnictvím tvůrce.
        </p>
      </section>

      <section>
        <h2>6. Žebříčky a uživatelský obsah</h2>

        <h3>6.1 Sledování skóre</h3>
        <p>
          Účastí ve hrách budou vaše skóre a uživatelské jméno zobrazeny ve veřejných žebříčcích. Vytvořením účtu souhlasíte s tímto veřejným zobrazením.
        </p>

        <h3>6.2 Integrita skóre</h3>
        <p>
          Vyhrazujeme si právo odstranit skóre, o kterých se důvodně domníváme, že byla získána podváděním, zneužitím chyb (exploits) nebo automatizovanými prostředky.
        </p>
      </section>

      <section>
        <h2>7. Dostupnost Služby</h2>
        <p>
          Snažíme se udržovat nepřetržitou dostupnost Služby, ale nezaručujeme:
        </p>
        <ul>
          <li>Že Služba bude nepřerušovaná nebo bez chyb</li>
          <li>Že závady budou opraveny</li>
          <li>Že Služba neobsahuje viry nebo jiné škodlivé komponenty</li>
        </ul>
        <p>
          Vyhrazujeme si právo Službu kdykoli bez upozornění pozastavit nebo ukončit.
        </p>
      </section>

      <section>
        <h2>8. Omezení odpovědnosti</h2>
        <p>
          V maximálním rozsahu povoleném zákonem nenesou provozovatelé World Quiz odpovědnost za:
        </p>
        <ul>
          <li>Jakékoli nepřímé, náhodné, zvláštní nebo následné škody</li>
          <li>Ztrátu zisku, dat nebo dobrého jména</li>
          <li>Přerušení služby nebo ztrátu dat</li>
          <li>Jednání služeb třetích stran (Firebase, Google, poskytovatelé API)</li>
        </ul>
      </section>

      <section>
        <h2>9. Ukončení</h2>
        <p>
          Pokud porušíte tyto Podmínky použití, můžeme váš účet okamžitě ukončit nebo pozastavit, a to bez předchozího upozornění nebo odpovědnosti.
        </p>
        <p>
          Svůj účet můžete kdykoli zrušit prostřednictvím stránky Nastavení. Po ukončení budou všechna vaše data do 24 hodin trvale smazána.
        </p>
      </section>

      <section>
        <h2>10. Rozhodné právo</h2>
        <p>
          Tyto Podmínky se řídí a vykládají v souladu se zákony České republiky a Evropské unie, bez ohledu na kolizní normy.
        </p>
      </section>

      <section>
        <h2>11. Změny podmínek</h2>
        <p>
          Vyhrazujeme si právo tyto Podmínky použití kdykoli upravit. Podstatné změny budou indikovány aktualizací data "Naposledy aktualizováno" v horní části této stránky. Další používání Služby po změnách představuje přijetí nových podmínek.
        </p>
      </section>

      <section>
        <h2>12. Kontaktní informace</h2>
        <p>
          Máte-li jakékoli dotazy nebo obavy týkající se těchto Podmínek použití:
        </p>
        <div className="contact-info">
          <p><strong>E-mail:</strong> <a href="mailto:terms@world-quiz.com">terms@world-quiz.com</a></p>
          <p><strong>Správce služby:</strong> Tým World Quiz</p>
          <p><strong>Příslušnost:</strong> Česká republika, Evropská unie</p>
        </div>
      </section>

      <section className="related-section">
        <h2>Související dokumenty</h2>
        <p>
          Přečtěte si prosím také naše <a href={buildLocalizedPath('/privacy', i18n.language)} onClick={(e) => { e.preventDefault(); navigate(buildLocalizedPath('/privacy', i18n.language)); }}>Zásady ochrany osobních údajů</a>, abyste porozuměli tomu, jak shromažďujeme, používáme a chráníme vaše osobní údaje.
        </p>
      </section>
    </>
  );
}