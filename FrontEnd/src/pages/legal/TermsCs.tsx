import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buildLocalizedPath } from '../../utils/localeRouting';

export function TermsCs() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  return (
    <>
      <h1>Obchodní podmínky</h1>
      <p className="last-updated">Poslední aktualizace: 16. prosince 2025</p>

      <section style={{ padding: '24px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px', marginBottom: '24px' }}>
        <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6' }}>
          ℹ️ <strong>Poznámka:</strong> Plná česká verze tohoto dokumentu je v přípravě.
          Pro právně závaznou verzi si prosím přečtěte <button
            onClick={async () => {
              await i18n.changeLanguage('en');
              navigate(buildLocalizedPath('/terms', 'en'));
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
        <h2>1. Přijetí podmínek</h2>
        <p>
          Přístupem a používáním World Quiz ("Služba") souhlasíte s těmito obchodními podmínkami a zavazujete se jimi řídit.
          Pokud nesouhlasíte s těmito podmínkami, nepoužívejte prosím Službu.
        </p>
      </section>

      <section>
        <h2>2. Popis služby</h2>
        <p>
          World Quiz je vzdělávací platforma pro geografické kvízy, která poskytuje:
        </p>
        <ul>
          <li>Interaktivní mapové geografické kvízy</li>
          <li>Karetní párové hry s vlajkami a tvary zemí</li>
          <li>Komplexní encyklopedie zemí s živými daty</li>
          <li>Globální žebříčky a sledování skóre</li>
        </ul>
      </section>

      <section>
        <h2>3. Kontaktní informace</h2>
        <p>
          Pro jakékoliv dotazy nebo obavy týkající se těchto obchodních podmínek:
        </p>
        <div className="contact-info">
          <p><strong>Email:</strong> <a href="mailto:terms@world-quiz.com">terms@world-quiz.com</a></p>
          <p><strong>Správce služby:</strong> World Quiz Team</p>
          <p><strong>Jurisdikce:</strong> Česká republika, Evropská unie</p>
        </div>
      </section>

      <section className="related-section">
        <h2>Související dokumenty</h2>
        <p>
          Přečtěte si také naše <a href={buildLocalizedPath('/privacy', i18n.language)} onClick={(e) => { e.preventDefault(); navigate(buildLocalizedPath('/privacy', i18n.language)); }}>Zásady ochrany osobních údajů</a>, abyste pochopili, jak shromažďujeme, používáme a chráníme vaše osobní údaje.
        </p>
      </section>
    </>
  );
}
