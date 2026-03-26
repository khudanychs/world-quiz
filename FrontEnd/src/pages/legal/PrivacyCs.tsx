import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buildLocalizedPath } from '../../utils/localeRouting';

export function PrivacyCs() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  return (
    <>
      <h1>Zásady ochrany osobních údajů</h1>
      <p className="last-updated">Naposledy aktualizováno: 16. prosince 2025</p>

      <section>
        <h2>1. Správce údajů</h2>
        <p>
          Správcem vašich osobních údajů podle Obecného nařízení o ochraně osobních údajů (GDPR) je:
        </p>
        <div className="data-controller-info">
          <p><strong>Služba:</strong> World Quiz</p>
          <p><strong>Správce:</strong> Tým World Quiz</p>
          <p><strong>Kontaktní e-mail:</strong> <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a></p>
          <p><strong>Příslušnost:</strong> Česká republika, Evropská unie</p>
        </div>
        <p>
          Tyto Zásady ochrany osobních údajů vysvětlují, jak shromažďujeme, používáme, zpracováváme a chráníme vaše osobní údaje v souladu s GDPR (Nařízení EU 2016/679) a českým zákonem č. 110/2019 Sb., o zpracování osobních údajů.
        </p>
      </section>

      <section>
        <h2>2. Právní základ pro zpracování</h2>
        <p>
          Vaše osobní údaje zpracováváme na základě následujících právních důvodů podle čl. 6 odst. 1 GDPR:
        </p>

        <h3>2.1 Plnění smlouvy (čl. 6 odst. 1 písm. b))</h3>
        <p>Zpracování je nezbytné pro poskytování Služby, kterou jste si vyžádali:</p>
        <ul>
          <li><strong>ID uživatele (Firebase UID):</strong> Vyžadováno k identifikaci vašeho jedinečného účtu a k přiřazení vašich herních dat.</li>
          <li><strong>Uživatelské jméno (Přezdívka):</strong> Vyžadováno pro zobrazení vaší identity v žebříčcích a v herním rozhraní.</li>
          <li><strong>Herní skóre a časová razítka:</strong> Vyžadováno k poskytování funkce žebříčků a sledování vašeho postupu.</li>
        </ul>

        <h3>2.2 Oprávněný zájem (čl. 6 odst. 1 písm. f))</h3>
        <p>Zpracování je nezbytné pro naše oprávněné zájmy při zajišťování bezpečnosti a technické funkčnosti:</p>
        <ul>
          <li><strong>E-mailová adresa:</strong> Používá se výhradně pro obnovu účtu a zajištění jedinečné identifikace uživatele. NEPOUŽÍVÁ se k marketingovým účelům.</li>
        </ul>

        <h3>2.3 Souhlas (čl. 6 odst. 1 písm. a))</h3>
        <p>Při použití přihlášení přes Google výslovně souhlasíte s:</p>
        <ul>
          <li>Sdílením vašeho Google ID, e-mailu a jména s naší Službou prostřednictvím Google OAuth 2.0.</li>
          <li>Přechodným zobrazením vašeho profilového obrázku z Googlu během aktivních relací (není trvale ukládáno).</li>
        </ul>
      </section>

      <section>
        <h2>3. Údaje, které shromažďujeme</h2>

        <h3>3.1 Autentizační údaje účtu</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Typ údaje</th>
              <th>Zdroj</th>
              <th>Účel</th>
              <th>Místo uložení</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ID uživatele (UID)</td>
              <td>Firebase Authentication</td>
              <td>Jedinečná identifikace účtu</td>
              <td>Firebase Auth, Firestore</td>
            </tr>
            <tr>
              <td>E-mailová adresa</td>
              <td>Vy / Google OAuth</td>
              <td>Obnova účtu, jedinečná identifikace</td>
              <td>Pouze Firebase Authentication</td>
            </tr>
            <tr>
              <td>Heslo (hashované)</td>
              <td>Vy (přihlášení e-mailem/heslem)</td>
              <td>Bezpečná autentizace</td>
              <td>Firebase Authentication</td>
            </tr>
            <tr>
              <td>Uživatelské jméno</td>
              <td>Vy</td>
              <td>Zobrazení v žebříčcích</td>
              <td>Cloud Firestore</td>
            </tr>
          </tbody>
        </table>

        <h3>3.2 Údaje o relaci (Netrvale ukládáno)</h3>
        <ul>
          <li><strong>Profilový obrázek Google:</strong> Přechodně zpracováván pro účely zobrazení během vaší aktivní relace. Tento obrázek se nikdy neukládá do trvalého úložiště (není uložen ve Firestore ani v žádné databázi).</li>
        </ul>

        <h3>3.3 Herní data</h3>
        <ul>
          <li><strong>Skóre:</strong> Denní a historicky nejlepší skóre pro každý herní mód.</li>
          <li><strong>Série (Streaks):</strong> Aktuální a maximální počet správných odpovědí v řadě.</li>
          <li><strong>Časová razítka:</strong> Datum a čas odehrání her.</li>
          <li><strong>Historie hraní:</strong> Historický záznam vašeho hraní pro statistické účely.</li>
        </ul>

        <h3>3.4 Technická data</h3>
        <ul>
          <li><strong>Místní úložiště prohlížeče (Local Storage):</strong> Relace (tokeny), uložená data žebříčků (cache), uživatelské předvolby.</li>
          <li><strong>Žádné soubory cookie:</strong> Nepoužíváme sledovací soubory cookie. Pouze nezbytnou správu relace prostřednictvím tokenů Firebase Authentication.</li>
        </ul>
      </section>

      <section>
        <h2>4. Zpracovatelé údajů třetích stran</h2>
        <p>
          Podle čl. 28 GDPR využíváme následující zpracovatele třetích stran, kteří mohou mít přístup k vašim údajům:
        </p>

        <h3>4.1 Google Ireland Limited</h3>
        <p><strong>Využívané služby:</strong></p>
        <ul>
          <li>Firebase Authentication - Přihlášení uživatele a správa přihlašovacích údajů</li>
          <li>Cloud Firestore - Databázové úložiště pro uživatelská jména a skóre</li>
          <li>Firebase Hosting - Doručování statických souborů</li>
        </ul>
        <p><strong>Přenášená data:</strong> ID uživatele, E-mail, Uživatelské jméno, Skóre</p>
        <p><strong>Lokalita:</strong> Datová centra v EU (v souladu s GDPR)</p>
        <p><strong>Zásady ochrany osobních údajů:</strong> <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">firebase.google.com/support/privacy</a></p>
        <p><strong>Smlouva o zpracování údajů:</strong> Uplatňuje se dodatek o zpracování dat Google Cloud v souladu s GDPR.</p>

        <h3>4.2 Externí rozhraní API (Žádná sdílená osobní data)</h3>
        <p>Následující služby NEPŘIJÍMAJÍ žádné osobní údaje:</p>
        <ul>
          <li><strong>REST Countries API:</strong> Poskytuje statistiky o zemích (anonymní požadavky)</li>
          <li><strong>Currency API:</strong> Poskytuje směnné kurzy (anonymní požadavky)</li>
        </ul>
      </section>

      <section>
        <h2>5. Vaše práva podle GDPR</h2>
        <p>
          Jako subjekt údajů v Evropské unii máte následující práva:
        </p>

        <h3>5.1 Právo na přístup (Článek 15)</h3>
        <p>
          Máte právo získat potvrzení, zda zpracováváme vaše osobní údaje, a právo na přístup k těmto údajům. Svá data si můžete prohlédnout na stránce Nastavení v aplikaci.
        </p>

        <h3>5.2 Právo na opravu (Článek 16)</h3>
        <p>
          Své uživatelské jméno můžete kdykoli aktualizovat na stránce Nastavení.
        </p>

        <h3>5.3 Právo na výmaz / „Právo být zapomenut“ (Článek 17)</h3>
        <p>
          Můžete požádat o úplné smazání vašeho účtu a všech souvisejících údajů:
        </p>
        <ul>
          <li>Použitím tlačítka „Smazat účet“ v Nastavení (vyžaduje opětovné ověření identity)</li>
          <li>Zasláním žádosti e-mailem na <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a></li>
        </ul>
        <p>
          Po smazání budou všechna vaše data (ID uživatele, uživatelské jméno, skóre, časová razítka) do 24 hodin trvale odstraněna z Firebase Authentication a Cloud Firestore.
        </p>

        <h3>5.4 Právo na přenositelnost údajů (Článek 20)</h3>
        <p>
          Máte právo získat své osobní údaje ve strukturovaném, běžně používaném a strojově čitelném formátu (JSON). Pro žádost o export dat kontaktujte <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a>.
        </p>
      </section>

      <section>
        <h2>6. Kontaktní informace</h2>
        <p>
          Máte-li jakékoli dotazy, obavy nebo žádosti týkající se těchto Zásad ochrany osobních údajů nebo vašich osobních údajů:
        </p>
        <div className="contact-info">
          <p><strong>E-mail:</strong> <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a></p>
          <p><strong>Správce údajů:</strong> Tým World Quiz</p>
          <p><strong>Doba odezvy:</strong> Do 1 měsíce</p>
        </div>
      </section>

      <section className="consent-section">
        <h2>7. Souhlas a přijetí</h2>
        <p>
          Vytvořením účtu a používáním World Quiz potvrzujete, že jste si přečetli a porozuměli těmto Zásadám ochrany osobních údajů a našim <a href={buildLocalizedPath('/terms', i18n.language)} onClick={(e) => { e.preventDefault(); navigate(buildLocalizedPath('/terms', i18n.language)); }}>Podmínkám použití</a>, a souhlasíte s:
        </p>
        <ul>
          <li>Shromažďováním a zpracováním vašich osobních údajů, jak je popsáno výše</li>
          <li>Používáním Firebase (Google Ireland Limited) jako zpracovatele údajů</li>
          <li>Veřejným zobrazením vašeho uživatelského jména a skóre v žebříčcích</li>
        </ul>
        <p>
          <strong>Svůj souhlas můžete kdykoli odvolat smazáním svého účtu.</strong>
        </p>
      </section>

      <section className="related-section">
        <h2>Související dokumenty</h2>
        <p>
          Přečtěte si prosím také naše <a href={buildLocalizedPath('/terms', i18n.language)} onClick={(e) => { e.preventDefault(); navigate(buildLocalizedPath('/terms', i18n.language)); }}>Podmínky použití</a>, abyste porozuměli pravidlům a pokynům pro používání služby World Quiz.
        </p>
      </section>
    </>
  );
}