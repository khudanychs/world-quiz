import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buildLocalizedPath } from '../../utils/localeRouting';

export function PrivacyDe() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  return (
    <>
      <h1>Datenschutzrichtlinie</h1>
      <p className="last-updated">Letzte Aktualisierung: 16. Dezember 2025</p>

      <section style={{ padding: '24px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px', marginBottom: '24px' }}>
        <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6' }}>
          ℹ️ <strong>Hinweis:</strong> Die vollständige deutsche Version dieses Dokuments ist in Vorbereitung.
          Für die rechtsverbindliche Version lesen Sie bitte die <button
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
            englische Version
          </button>.
        </p>
      </section>

      <section>
        <h2>1. Datenverantwortlicher</h2>
        <p>
          Der für Ihre personenbezogenen Daten nach der Datenschutz-Grundverordnung (DSGVO) verantwortliche Datenverantwortliche ist:
        </p>
        <div className="data-controller-info">
          <p><strong>Service:</strong> World Quiz</p>
          <p><strong>Verantwortlicher:</strong> World Quiz Team</p>
          <p><strong>Kontakt-E-Mail:</strong> <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a></p>
          <p><strong>Gerichtsstand:</strong> Tschechische Republik, Europäische Union</p>
        </div>
      </section>

      <section>
        <h2>2. Welche Daten erfassen wir</h2>
        <p>
          Wir erfassen nur die für die Bereitstellung des Services erforderlichen Daten:
        </p>
        <ul>
          <li><strong>Benutzer-ID (UID):</strong> Zur Identifizierung Ihres Kontos</li>
          <li><strong>E-Mail-Adresse:</strong> Für Kontowiederherstellung und eindeutige Identifizierung</li>
          <li><strong>Benutzername:</strong> Zur Anzeige in Bestenlisten</li>
          <li><strong>Spielstände und Zeitstempel:</strong> Für Bestenlisten-Funktionalität</li>
        </ul>
      </section>

      <section>
        <h2>3. Ihre Rechte nach DSGVO</h2>
        <p>
          Als betroffene Person in der Europäischen Union haben Sie folgende Rechte:
        </p>
        <ul>
          <li><strong>Auskunftsrecht:</strong> Sie können Ihre Daten in den Einstellungen einsehen</li>
          <li><strong>Recht auf Berichtigung:</strong> Sie können Ihren Benutzernamen jederzeit aktualisieren</li>
          <li><strong>Recht auf Löschung:</strong> Sie können die vollständige Löschung Ihres Kontos beantragen</li>
          <li><strong>Recht auf Datenübertragbarkeit:</strong> Sie können einen Export Ihrer Daten anfordern</li>
        </ul>
      </section>

      <section>
        <h2>4. Kontaktinformationen</h2>
        <p>
          Für Fragen oder Bedenken zu dieser Datenschutzrichtlinie:
        </p>
        <div className="contact-info">
          <p><strong>E-Mail:</strong> <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a></p>
          <p><strong>Datenverantwortlicher:</strong> World Quiz Team</p>
          <p><strong>Antwortzeit:</strong> Innerhalb von 1 Monat</p>
        </div>
      </section>

      <section className="related-section">
        <h2>Verwandte Dokumente</h2>
        <p>
          Bitte lesen Sie auch unsere <a href={buildLocalizedPath('/terms', i18n.language)} onClick={(e) => { e.preventDefault(); navigate(buildLocalizedPath('/terms', i18n.language)); }}>Allgemeinen Geschäftsbedingungen</a>, um die Regeln und Richtlinien für die Nutzung von World Quiz zu verstehen.
        </p>
      </section>
    </>
  );
}
