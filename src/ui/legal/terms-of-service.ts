import { html } from "@hyperspan/html";
import { site } from "~/src/config/site.ts";

const EFFECTIVE_DATE = "July 14, 2026";

export function termsOfServiceContent() {
  return html`
    <article class="prose prose-neutral max-w-none">
      <h1>Terms of Service</h1>
      <p><strong>Effective date:</strong> ${EFFECTIVE_DATE}</p>

      <p>
        These Terms of Service ("Terms") govern your access to and use of Corkbord, operated by
        Infinite Rectangles ("we", "us", or "our"). By creating an account or using the Service, you
        agree to these Terms.
      </p>

      <h2>The Service</h2>
      <p>
        Corkbord helps you collect content from RSS feeds or manual notes, preview adapted posts for
        social channels, and publish to connected X and LinkedIn accounts. Features may change as we
        improve the product.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must provide accurate registration information and keep credentials secure.</li>
        <li>You are responsible for activity under your account and organization.</li>
        <li>You must be at least 13 years old to use the Service.</li>
      </ul>

      <h2>Your content and connected accounts</h2>
      <ul>
        <li>You retain ownership of content you import or create in Corkbord.</li>
        <li>
          You grant us a limited license to process, store, and display your content solely to
          operate the Service, including generating previews and posting to channels you authorize.
        </li>
        <li>
          You represent that you have the rights to import, adapt, and publish content through the
          Service, including compliance with RSS feed terms and social platform rules.
        </li>
        <li>
          When connecting X or LinkedIn, you authorize Corkbord to act on your behalf according to
          your in-app actions (e.g., approving or scheduling posts).
        </li>
      </ul>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for unlawful, harmful, or spam activity</li>
        <li>Violate third-party terms, including X, LinkedIn, or RSS source policies</li>
        <li>Attempt to access other users' data or disrupt the Service</li>
        <li>Reverse engineer or misuse API credentials or OAuth tokens</li>
      </ul>

      <h2>Third-party platforms</h2>
      <p>
        Corkbord is not affiliated with X or LinkedIn. Your use of those platforms remains subject
        to their respective terms. We are not responsible for actions taken by third-party
        platforms, including account restrictions or content removal.
      </p>

      <h2>Disclaimer of warranties</h2>
      <p>
        THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
        INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT
        GUARANTEE UNINTERRUPTED OR ERROR-FREE OPERATION.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, INFINITE RECTANGLES WILL NOT BE LIABLE FOR ANY
        INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
        DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.
      </p>

      <h2>Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate access if you
        violate these Terms or if required for security or legal reasons.
      </p>

      <h2>Changes</h2>
      <p>
        We may modify these Terms from time to time. Continued use after changes are posted
        constitutes acceptance of the updated Terms.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of Texas, United States, without regard to
        conflict-of-law principles.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms? Email us at
        <a href="mailto:${site.supportEmail}">${site.supportEmail}</a>.
      </p>
    </article>
  `;
}
