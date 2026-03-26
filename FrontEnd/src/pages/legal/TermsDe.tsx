import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buildLocalizedPath } from '../../utils/localeRouting';

export function TermsDe() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  return (
    <>
      <h1>Nutzungsbedingungen</h1>
      <p className="last-updated">Zuletzt aktualisiert: 16. Dezember 2025</p>

      <section>
        <h2>1. Annahme der Bedingungen</h2>
        <p>
          Durch den Zugriff auf und die Nutzung von World Quiz ("der Dienst") akzeptieren Sie diese Nutzungsbedingungen und erklären sich damit einverstanden, an diese gebunden zu sein. Wenn Sie diesen Bedingungen nicht zustimmen, nutzen Sie den Dienst bitte nicht.
        </p>
      </section>

      <section>
        <h2>2. Leistungsbeschreibung</h2>
        <p>
          World Quiz ist eine pädagogische Geografie-Quiz-Plattform, die Folgendes bietet:
        </p>
        <ul>
          <li>Interaktive kartenbasierte Geografie-Quizze</li>
          <li>Karten-Zuordnungsspiele mit Länderflaggen und -umrissen</li>
          <li>Eine umfassende Länderenzyklopädie mit Live-Daten</li>
          <li>Globale Bestenlisten und Verfolgung von Spielständen</li>
        </ul>
        <p>
          Der Dienst wird "wie besehen" ohne jegliche ausdrückliche oder stillschweigende Gewährleistung zur Verfügung gestellt.
        </p>
      </section>

      <section>
        <h2>3. Benutzerkonten</h2>

        <h3>3.1 Kontoerstellung</h3>
        <p>Um auf bestimmte Funktionen zugreifen zu können, müssen Sie ein Konto erstellen, indem Sie Folgendes angeben:</p>
        <ul>
          <li>Eine gültige E-Mail-Adresse</li>
          <li>Einen eindeutigen Benutzernamen (Spitznamen)</li>
          <li>Ein sicheres Passwort (bei E-Mail/Passwort-Registrierung)</li>
        </ul>
        <p>
          Alternativ können Sie sich über die Google OAuth 2.0-Authentifizierung anmelden.
        </p>

        <h3>3.2 Kontoverantwortung</h3>
        <p>Sie sind verantwortlich für:</p>
        <ul>
          <li>Die Wahrung der Vertraulichkeit Ihrer Zugangsdaten</li>
          <li>Alle Aktivitäten, die unter Ihrem Konto stattfinden</li>
          <li>Die sofortige Benachrichtigung über jede unbefugte Nutzung</li>
        </ul>

        <h3>3.3 Kontoverifizierung</h3>
        <p>
          Konten mit E-Mail/Passwort erfordern eine E-Mail-Verifizierung innerhalb von 1 Stunde nach der Registrierung. Nicht verifizierte Konten werden automatisch gelöscht.
        </p>
      </section>

      <section>
        <h2>4. Zulässige Nutzung</h2>
        <p>Sie erklären sich damit einverstanden, Folgendes NICHT zu tun:</p>
        <ul>
          <li>Den Dienst für ungesetzliche Zwecke zu nutzen</li>
          <li>Zu versuchen, unbefugten Zugriff auf den Dienst oder die Konten anderer Benutzer zu erlangen</li>
          <li>Einen Teil des Dienstes zurückzuentwickeln (Reverse Engineering), zu dekompilieren oder zu disassemblieren</li>
          <li>Automatisierte Skripte oder Bots zu verwenden, um Spielstände oder Bestenlisten zu manipulieren</li>
          <li>Viren, Malware oder andere bösartige Codes hochzuladen oder zu übertragen</li>
          <li>Andere Benutzer zu belästigen, zu missbrauchen oder zu schädigen</li>
          <li>Sich als eine andere Person oder Einrichtung auszugeben</li>
          <li>Beleidigende oder unangemessene Benutzernamen zu verwenden</li>
        </ul>
      </section>

      <section>
        <h2>5. Geistiges Eigentum</h2>
        <p>
          Alle Inhalte, Merkmale und Funktionen von World Quiz, einschließlich, aber nicht beschränkt auf Text, Grafiken, Logos, Symbole und Software, sind Eigentum des Dienstanbieters und durch internationale Urheber-, Marken- und andere Gesetze zum Schutz des geistigen Eigentums geschützt.
        </p>
        <p>
          Der Dienst ist unter der MIT-Lizenz für die Open-Source-Codebasis lizenziert. Die Marke World Quiz, das Design und die nutzergenerierten Inhalte bleiben jedoch urheberrechtlich geschützt.
        </p>
      </section>

      <section>
        <h2>6. Bestenlisten und Benutzerinhalte</h2>

        <h3>6.1 Verfolgung von Spielständen</h3>
        <p>
          Durch die Teilnahme an Spielen werden Ihre Spielstände und Ihr Benutzername auf öffentlichen Bestenlisten angezeigt. Sie stimmen dieser öffentlichen Anzeige durch die Erstellung eines Kontos zu.
        </p>

        <h3>6.2 Integrität der Spielstände</h3>
        <p>
          Wir behalten uns das Recht vor, Spielstände zu entfernen, von denen wir begründeterweise annehmen, dass sie durch Betrug, das Ausnutzen von Fehlern (Exploits) oder automatisierte Mittel erzielt wurden.
        </p>
      </section>

      <section>
        <h2>7. Serviceverfügbarkeit</h2>
        <p>
          Wir bemühen uns um eine kontinuierliche Verfügbarkeit des Dienstes, garantieren jedoch nicht:
        </p>
        <ul>
          <li>Dass der Dienst ununterbrochen oder fehlerfrei ist</li>
          <li>Dass Fehler behoben werden</li>
          <li>Dass der Dienst frei von Viren oder anderen schädlichen Komponenten ist</li>
        </ul>
        <p>
          Wir behalten uns das Recht vor, den Dienst jederzeit und ohne Vorankündigung auszusetzen oder zu beenden.
        </p>
      </section>

      <section>
        <h2>8. Haftungsbeschränkung</h2>
        <p>
          Soweit gesetzlich zulässig, haften World Quiz und seine Betreiber nicht für:
        </p>
        <ul>
          <li>Jegliche indirekten, zufälligen, besonderen oder Folgeschäden</li>
          <li>Verlust von Gewinnen, Daten oder Firmenwert</li>
          <li>Dienstunterbrechungen oder Datenverlust</li>
          <li>Handlungen von Drittanbieterdiensten (Firebase, Google, API-Anbieter)</li>
        </ul>
      </section>

      <section>
        <h2>9. Kündigung</h2>
        <p>
          Wir können Ihr Konto sofort und ohne vorherige Ankündigung oder Haftung kündigen oder sperren, wenn Sie gegen diese Nutzungsbedingungen verstoßen.
        </p>
        <p>
          Sie können Ihr Konto jederzeit über die Einstellungsseite kündigen. Nach der Kündigung werden alle Ihre Daten innerhalb von 24 Stunden dauerhaft gelöscht.
        </p>
      </section>

      <section>
        <h2>10. Geltendes Recht</h2>
        <p>
          Diese Bedingungen unterliegen den Gesetzen der Tschechischen Republik und der Europäischen Union und werden in Übereinstimmung mit diesen ausgelegt, ohne Rücksicht auf kollisionsrechtliche Bestimmungen.
        </p>
      </section>

      <section>
        <h2>11. Änderungen der Bedingungen</h2>
        <p>
          Wir behalten uns das Recht vor, diese Nutzungsbedingungen jederzeit zu ändern. Wesentliche Änderungen werden durch Aktualisierung des Datums "Zuletzt aktualisiert" oben auf dieser Seite kenntlich gemacht. Die fortgesetzte Nutzung des Dienstes nach Änderungen stellt die Annahme der neuen Bedingungen dar.
        </p>
      </section>

      <section>
        <h2>12. Kontaktinformationen</h2>
        <p>
          Bei Fragen oder Bedenken bezüglich dieser Nutzungsbedingungen:
        </p>
        <div className="contact-info">
          <p><strong>E-Mail:</strong> <a href="mailto:terms@world-quiz.com">terms@world-quiz.com</a></p>
          <p><strong>Dienstanbieter:</strong> World Quiz Team</p>
          <p><strong>Gerichtsstand:</strong> Tschechische Republik, Europäische Union</p>
        </div>
      </section>

      <section className="related-section">
        <h2>Zugehörige Dokumente</h2>
        <p>
          Bitte lesen Sie auch unsere <a href={buildLocalizedPath('/privacy', i18n.language)} onClick={(e) => { e.preventDefault(); navigate(buildLocalizedPath('/privacy', i18n.language)); }}>Datenschutzerklärung</a>, um zu verstehen, wie wir Ihre personenbezogenen Daten erheben, verwenden und schützen.
        </p>
      </section>
    </>
  );
}