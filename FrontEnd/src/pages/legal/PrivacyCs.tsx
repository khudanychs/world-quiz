import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buildLocalizedPath } from '../../utils/localeRouting';

export function PrivacyCs() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  return (
    <>
      <h1>Zásady ochrany osobních údajů</h1>
      <p className="last-updated">Poslední aktualizace: 16. prosince 2025</p>

      <section style={{ padding: '24px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px', marginBottom: '24px' }}>
        <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6' }}>
          ℹ️ <strong>Poznámka:</strong> Plná česká verze tohoto dokumentu je v přípravě.
          Pro právně závaznou verzi si prosím přečtěte <button
            onClick={async () => {
              await i18n.changeLanguage('en');
              navigate(buildLocalizedPath('/privacy', 'en'));
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              font: 'inherit'
            }}
          >
            anglickou verzi
          </button>.
        </p>
      </section>

      <section>
        <h2>1. Správce údajů</h2>
        <p>
          Správcem údajů odpovědným za vaše osobní údaje podle nařízení GDPR (Obecné nařízení o ochraně osobních údajů) je:
        </p>
        <div className="data-controller-info">
          <p><strong>Služba:</strong> World Quiz</p>
          <p><strong>Správce:</strong> World Quiz Team</p>
          <p><strong>Kontaktní email:</strong> <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a></p>
          <p><strong>Jurisdikce:</strong> Česká republika, Evropská unie</p>
        </div>
      </section>

      <section>
        <h2>2. Jaké údaje shromažďujeme</h2>
        <p>
          Shromažďujeme pouze údaje nezbytné pro poskytování služby:
        </p>
        <ul>
          <li><strong>ID uživatele (UID):</strong> Pro identifikaci vašeho účtu</li>
          <li><strong>E-mailová adresa:</strong> Pro obnovu účtu a jedinečnou identifikaci</li>
          <li><strong>Uživatelské jméno:</strong> Pro zobrazení v žebříčcích</li>
          <li><strong>Herní skóre a časové značky:</strong> Pro funkci žebříčků</li>
        </ul>
      </section>

      <section>
        <h2>3. Vaše práva podle GDPR</h2>
        <p>
          Jako subjekt údajů v Evropské unii máte následující práva:
        </p>
        <ul>
          <li><strong>Právo na přístup:</strong> Můžete si prohlédnout své údaje v nastavení</li>
          <li><strong>Právo na opravu:</strong> Můžete kdykoliv aktualizovat své uživatelské jméno</li>
          <li><strong>Právo na výmaz:</strong> Můžete požádat o úplné smazání svého účtu</li>
          <li><strong>Právo na přenositelnost údajů:</strong> Můžete požádat o export svých údajů</li>
        </ul>
      </section>

      <section>
        <h2>4. Kontaktní informace</h2>
        <p>
          Pro jakékoliv dotazy nebo obavy týkající se těchto zásad ochrany osobních údajů:
        </p>
        <div className="contact-info">
          <p><strong>Email:</strong> <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a></p>
          <p><strong>Správce údajů:</strong> World Quiz Team</p>
          <p><strong>Doba odezvy:</strong> Do 1 měsíce</p>
        </div>
      </section>

      <section className="related-section">
        <h2>Související dokumenty</h2>
        <p>
          Přečtěte si také naše <a href={buildLocalizedPath('/terms', i18n.language)} onClick={(e) => { e.preventDefault(); navigate(buildLocalizedPath('/terms', i18n.language)); }}>Obchodní podmínky</a>, abyste pochopili pravidla a pokyny pro používání World Quiz.
        </p>
      </section>
    </>
  );
}
