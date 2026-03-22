import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buildLocalizedPath } from '../../utils/localeRouting';

export function TermsDe() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  return (
    <>
      <h1>Allgemeine Geschäftsbedingungen</h1>
      <p className="last-updated">Letzte Aktualisierung: 16. Dezember 2025</p>

      <section style={{ padding: '24px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px', marginBottom: '24px' }}>
        <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6' }}>
          ℹ️ <strong>Hinweis:</strong> Die vollständige deutsche Version dieses Dokuments ist in Vorbereitung.
          Für die rechtsverbindliche Version lesen Sie bitte die <button
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
            englische Version
          </button>.
        </p>
      </section>

      <section>
        <h2>1. Annahme der Bedingungen</h2>
        <p>
          Durch den Zugriff auf und die Nutzung von World Quiz ("der Service") akzeptieren Sie diese Allgemeinen
          Geschäftsbedingungen und stimmen zu, an sie gebunden zu sein. Wenn Sie mit diesen Bedingungen nicht
          einverstanden sind, nutzen Sie bitte den Service nicht.
        </p>
      </section>

      <section>
        <h2>2. Servicebeschreibung</h2>
        <p>
          World Quiz ist eine Bildungsplattform für Geographie-Quiz, die Folgendes bietet:
        </p>
        <ul>
          <li>Interaktive kartenbasierte Geographie-Quiz</li>
          <li>Kartenspiele zum Zuordnen von Länderflaggen und -formen</li>
          <li>Eine umfassende Länderenzyklopädie mit Live-Daten</li>
          <li>Globale Bestenlisten und Punkteverfolgung</li>
        </ul>
      </section>

      <section>
        <h2>3. Kontaktinformationen</h2>
        <p>
          Für Fragen oder Bedenken zu diesen Allgemeinen Geschäftsbedingungen:
        </p>
        <div className="contact-info">
          <p><strong>E-Mail:</strong> <a href="mailto:terms@world-quiz.com">terms@world-quiz.com</a></p>
          <p><strong>Service-Controller:</strong> World Quiz Team</p>
          <p><strong>Gerichtsstand:</strong> Tschechische Republik, Europäische Union</p>
        </div>
      </section>

      <section className="related-section">
        <h2>Verwandte Dokumente</h2>
        <p>
          Bitte lesen Sie auch unsere <a href={buildLocalizedPath('/privacy', i18n.language)} onClick={(e) => { e.preventDefault(); navigate(buildLocalizedPath('/privacy', i18n.language)); }}>Datenschutzrichtlinie</a>, um zu verstehen, wie wir Ihre persönlichen Daten erfassen, verwenden und schützen.
        </p>
      </section>
    </>
  );
}
