import { html } from "@hyperspan/html";
import { site } from "~/src/config/site.ts";

const EFFECTIVE_DATE = "July 14, 2026";

export function privacyPolicyContent() {
  return html`
    <article class="prose prose-neutral max-w-none">
      <h1>Privacy Policy</h1>
      <p><strong>Effective date:</strong> ${EFFECTIVE_DATE}</p>

      <p>
        Corkbord ("we", "us", or "our") is operated by Infinite Rectangles. This Privacy Policy
        explains how we collect, use, and protect information when you use the Corkbord website and
        application at ${site.domain} (the "Service").
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information:</strong> Email address, name, and organization details you
          provide when registering.
        </li>
        <li>
          <strong>Content you add:</strong> RSS feed URLs, manually entered notes, and content
          imported into your feed.
        </li>
        <li>
          <strong>Connected channel data:</strong> When you connect X or LinkedIn, we receive OAuth
          tokens and basic profile or page information needed to post on your behalf. We do not
          store your social network passwords.
        </li>
        <li>
          <strong>Usage data:</strong> Standard server logs (IP address, browser type, pages
          visited, timestamps) used for security and reliability.
        </li>
      </ul>

      <h2>How we use information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Provide, operate, and maintain the Service</li>
        <li>Import content from RSS sources you configure</li>
        <li>
          Generate channel-specific previews and publish posts you approve to connected accounts
        </li>
        <li>Authenticate you and manage your organization workspace</li>
        <li>Respond to support requests and protect against abuse</li>
      </ul>

      <h2>Third-party services</h2>
      <p>
        Corkbord integrates with third-party platforms including X, LinkedIn, and optional AI
        providers for content adaptation. Your use of those integrations is also subject to each
        platform's terms and privacy policies. We only request the permissions needed to perform
        actions you initiate in Corkbord.
      </p>

      <h2>Data retention and security</h2>
      <p>
        We retain account and content data while your account is active. OAuth tokens are encrypted
        at rest. You may disconnect channels or delete your account to remove associated channel
        credentials. We use reasonable administrative and technical safeguards to protect your data,
        but no method of transmission over the Internet is completely secure.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Disconnect X or LinkedIn at any time from your Corkbord channel settings</li>
        <li>Disable or remove RSS sources you no longer want imported</li>
        <li>Contact us to request access, correction, or deletion of personal data</li>
      </ul>

      <h2>Children</h2>
      <p>
        The Service is not directed to children under 13, and we do not knowingly collect personal
        information from children.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this Privacy Policy from time to time. We will post the revised policy on this
        page and update the effective date above.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this Privacy Policy? Email us at
        <a href="mailto:${site.supportEmail}">${site.supportEmail}</a>.
      </p>
    </article>
  `;
}
