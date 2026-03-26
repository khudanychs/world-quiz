import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buildLocalizedPath } from '../../utils/localeRouting';

export function PrivacyDe() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  return (
    <>
      <h1>Datenschutzerklärung</h1>
      <p className="last-updated">Zuletzt aktualisiert: 16. Dezember 2025</p>

      <section>
        <h2>1. Verantwortliche Stelle</h2>
        <p>
          Der Verantwortliche für Ihre personenbezogenen Daten im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
        </p>
        <div className="data-controller-info">
          <p><strong>Dienst:</strong> World Quiz</p>
          <p><strong>Verantwortlicher:</strong> World Quiz Team</p>
          <p><strong>Kontakt-E-Mail:</strong> <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a></p>
          <p><strong>Gerichtsstand:</strong> Tschechische Republik, Europäische Union</p>
        </div>
        <p>
          Diese Datenschutzerklärung erläutert, wie wir Ihre personenbezogenen Daten in Übereinstimmung mit der DSGVO (Verordnung EU 2016/679) und dem tschechischen Gesetz Nr. 110/2019 Slg. über die Verarbeitung personenbezogener Daten erheben, verwenden, verarbeiten und schützen.
        </p>
      </section>

      <section>
        <h2>2. Rechtsgrundlage der Verarbeitung</h2>
        <p>
          Wir verarbeiten Ihre personenbezogenen Daten auf Basis der folgenden Rechtsgrundlagen gemäß Art. 6 Abs. 1 DSGVO:
        </p>

        <h3>2.1 Vertragserfüllung (Art. 6 Abs. 1 lit. b)</h3>
        <p>Die Verarbeitung ist für die Bereitstellung des von Ihnen angeforderten Dienstes erforderlich:</p>
        <ul>
          <li><strong>Benutzer-ID (Firebase UID):</strong> Erforderlich, um Ihr eindeutiges Konto zu identifizieren und Ihre Spieldaten zuzuordnen.</li>
          <li><strong>Benutzername:</strong> Erforderlich, um Ihre Identität in den Bestenlisten und auf der Benutzeroberfläche des Spiels anzuzeigen.</li>
          <li><strong>Spielstände & Zeitstempel:</strong> Erforderlich, um die Bestenlisten-Funktion bereitzustellen und Ihren Fortschritt zu verfolgen.</li>
        </ul>

        <h3>2.2 Berechtigtes Interesse (Art. 6 Abs. 1 lit. f)</h3>
        <p>Die Verarbeitung ist zur Wahrung unserer berechtigten Interessen an der Gewährleistung der Sicherheit und technischen Funktionalität erforderlich:</p>
        <ul>
          <li><strong>E-Mail-Adresse:</strong> Wird ausschließlich für die Kontowiederherstellung und zur eindeutigen Benutzeridentifikation verwendet. Sie wird NICHT für Marketingzwecke verwendet.</li>
        </ul>

        <h3>2.3 Einwilligung (Art. 6 Abs. 1 lit. a)</h3>
        <p>Wenn Sie Google Sign-In verwenden, stimmen Sie ausdrücklich Folgendem zu:</p>
        <ul>
          <li>Teilen Ihrer Google-Nutzer-ID, E-Mail-Adresse und Ihres Namens mit unserem Dienst über Google OAuth 2.0.</li>
          <li>Vorübergehende Anzeige Ihres Google-Profilbildes während aktiver Sitzungen (wird nicht dauerhaft gespeichert).</li>
        </ul>
      </section>

      <section>
        <h2>3. Daten, die wir erheben</h2>

        <h3>3.1 Konto-Authentifizierungsdaten</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Datentyp</th>
              <th>Quelle</th>
              <th>Zweck</th>
              <th>Speicherort</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Benutzer-ID (UID)</td>
              <td>Firebase Authentication</td>
              <td>Eindeutige Kontoidentifikation</td>
              <td>Firebase Auth, Firestore</td>
            </tr>
            <tr>
              <td>E-Mail-Adresse</td>
              <td>Sie / Google OAuth</td>
              <td>Kontowiederherstellung, eindeutige Identifikation</td>
              <td>Nur Firebase Authentication</td>
            </tr>
            <tr>
              <td>Passwort (gehasht)</td>
              <td>Sie (E-Mail/Passwort-Anmeldung)</td>
              <td>Sichere Authentifizierung</td>
              <td>Firebase Authentication</td>
            </tr>
            <tr>
              <td>Benutzername</td>
              <td>Sie</td>
              <td>Anzeige in Bestenlisten</td>
              <td>Cloud Firestore</td>
            </tr>
          </tbody>
        </table>

        <h3>3.2 Sitzungsdaten (nicht dauerhaft gespeichert)</h3>
        <ul>
          <li><strong>Google-Profilbild:</strong> Wird vorübergehend für Anzeigezwecke während Ihrer aktiven Sitzung verarbeitet. Dieses Bild wird niemals dauerhaft gespeichert (nicht in Firestore oder einer anderen Datenbank gespeichert).</li>
        </ul>

        <h3>3.3 Spieldaten</h3>
        <ul>
          <li><strong>Spielstände:</strong> Tägliche Bestwerte und Allzeit-Bestwerte für jeden Spielmodus.</li>
          <li><strong>Serien (Streaks):</strong> Aktuelle und maximale Anzahl an richtigen Antworten in Folge.</li>
          <li><strong>Zeitstempel:</strong> Datum und Uhrzeit, wann Spiele gespielt werden.</li>
          <li><strong>Spielhistorie:</strong> Historische Aufzeichnung Ihres Spielverlaufs für statistische Zwecke.</li>
        </ul>

        <h3>3.4 Technische Daten</h3>
        <ul>
          <li><strong>Lokaler Browser-Speicher (Local Storage):</strong> Sitzungstoken, zwischengespeicherte Bestenlisten-Daten (Cache), Benutzereinstellungen.</li>
          <li><strong>Keine Cookies:</strong> Wir verwenden keine Tracking-Cookies. Nur wesentliches Sitzungsmanagement über Firebase-Authentifizierungstoken.</li>
        </ul>
      </section>

      <section>
        <h2>4. Auftragsverarbeiter von Drittanbietern</h2>
        <p>
          Gemäß Art. 28 DSGVO beauftragen wir die folgenden Auftragsverarbeiter, die Zugriff auf Ihre Daten haben könnten:
        </p>

        <h3>4.1 Google Ireland Limited</h3>
        <p><strong>Genutzte Dienste:</strong></p>
        <ul>
          <li>Firebase Authentication - Benutzeranmeldung und Verwaltung der Zugangsdaten</li>
          <li>Cloud Firestore - Datenbankspeicher für Benutzernamen und Spielstände</li>
          <li>Firebase Hosting - Bereitstellung statischer Dateien</li>
        </ul>
        <p><strong>Übermittelte Daten:</strong> Benutzer-ID, E-Mail, Benutzername, Spielstände</p>
        <p><strong>Standort:</strong> EU-Rechenzentren (DSGVO-konform)</p>
        <p><strong>Datenschutzerklärung:</strong> <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">firebase.google.com/support/privacy</a></p>
        <p><strong>Auftragsverarbeitungsvertrag:</strong> Der DSGVO-konforme Zusatz zur Datenverarbeitung von Google Cloud findet Anwendung.</p>

        <h3>4.2 Externe APIs (Keine Weitergabe personenbezogener Daten)</h3>
        <p>Die folgenden Dienste erhalten KEINE personenbezogenen Daten:</p>
        <ul>
          <li><strong>REST Countries API:</strong> Liefert Länderstatistiken (anonyme Anfragen)</li>
          <li><strong>Currency API:</strong> Liefert Wechselkurse (anonyme Anfragen)</li>
        </ul>
      </section>

      <section>
        <h2>5. Ihre Rechte gemäß DSGVO</h2>
        <p>
          Als betroffene Person in der Europäischen Union haben Sie folgende Rechte:
        </p>

        <h3>5.1 Auskunftsrecht (Artikel 15)</h3>
        <p>
          Sie haben das Recht, eine Bestätigung darüber zu verlangen, ob wir Ihre personenbezogenen Daten verarbeiten, und Auskunft über diese Daten zu erhalten. Sie können Ihre Daten über die Einstellungsseite in der Anwendung einsehen.
        </p>

        <h3>5.2 Recht auf Berichtigung (Artikel 16)</h3>
        <p>
          Sie können Ihren Benutzernamen jederzeit auf der Einstellungsseite aktualisieren.
        </p>

        <h3>5.3 Recht auf Löschung / „Recht auf Vergessenwerden“ (Artikel 17)</h3>
        <p>
          Sie können die vollständige Löschung Ihres Kontos und aller zugehörigen Daten verlangen, indem Sie:
        </p>
        <ul>
          <li>Die Schaltfläche "Konto löschen" in den Einstellungen verwenden (erfordert eine erneute Authentifizierung)</li>
          <li>Eine E-Mail-Anfrage an <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a> senden</li>
        </ul>
        <p>
          Nach der Löschung werden alle Ihre Daten (Benutzer-ID, Benutzername, Spielstände, Zeitstempel) innerhalb von 24 Stunden dauerhaft aus Firebase Authentication und Cloud Firestore entfernt.
        </p>

        <h3>5.4 Recht auf Datenübertragbarkeit (Artikel 20)</h3>
        <p>
          Sie haben das Recht, Ihre personenbezogenen Daten in einem strukturierten, gängigen und maschinenlesbaren Format (JSON) zu erhalten. Kontaktieren Sie <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a>, um einen Datenexport anzufordern.
        </p>
      </section>

      <section>
        <h2>6. Kontaktinformationen</h2>
        <p>
          Für Fragen, Bedenken oder Anfragen bezüglich dieser Datenschutzerklärung oder Ihrer personenbezogenen Daten:
        </p>
        <div className="contact-info">
          <p><strong>E-Mail:</strong> <a href="mailto:privacypolicy@world-quiz.com">privacypolicy@world-quiz.com</a></p>
          <p><strong>Verantwortliche Stelle:</strong> World Quiz Team</p>
          <p><strong>Antwortzeit:</strong> Innerhalb 1 Monats</p>
        </div>
      </section>

      <section className="consent-section">
        <h2>7. Einwilligung und Annahme</h2>
        <p>
          Indem Sie ein Konto erstellen und World Quiz nutzen, bestätigen Sie, dass Sie diese Datenschutzerklärung und unsere <a href={buildLocalizedPath('/terms', i18n.language)} onClick={(e) => { e.preventDefault(); navigate(buildLocalizedPath('/terms', i18n.language)); }}>Nutzungsbedingungen</a> gelesen und verstanden haben, und Sie willigen ein in:
        </p>
        <ul>
          <li>Die Erhebung und Verarbeitung Ihrer personenbezogenen Daten wie oben beschrieben</li>
          <li>Die Nutzung von Firebase (Google Ireland Limited) als Auftragsverarbeiter</li>
          <li>Die öffentliche Anzeige Ihres Benutzernamens und Ihrer Spielstände in den Bestenlisten</li>
        </ul>
        <p>
          <strong>Sie können Ihre Einwilligung jederzeit widerrufen, indem Sie Ihr Konto löschen.</strong>
        </p>
      </section>

      <section className="related-section">
        <h2>Zugehörige Dokumente</h2>
        <p>
          Bitte lesen Sie auch unsere <a href={buildLocalizedPath('/terms', i18n.language)} onClick={(e) => { e.preventDefault(); navigate(buildLocalizedPath('/terms', i18n.language)); }}>Nutzungsbedingungen</a>, um die Regeln und Richtlinien für die Nutzung von World Quiz zu verstehen.
        </p>
      </section>
    </>
  );
}