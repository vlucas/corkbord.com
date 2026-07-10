# Corkbord (corkbord.com)

Repurpose one content feed across social channels. Import RSS (or create content manually), generate per-channel AI previews on demand, then approve and schedule posts to X and LinkedIn (and others in the future).

## Architecture

This app uses the Hyperspan framework. Docs are here: https://www.hyperspan.dev/llms.txt

- Routes are in app/routes
- Use actions when possible for forms. These go in app/actions. Expanded rules and guidelines for using actions are below.
- Use DaisyUI for UI compnents and TailwindCSS for additonal styles when needed
- NEVER edit files in the "drizzle" folder. Only edit the schema. Drizzle will generate and manage the actual SQL migrations itself.

### Folder Structure

`/app` -> Application folder for Hyperspan routes, actions, layouts, etc.
`/src/server` -> Server-side library files, grouped by domain/purpose
`/src/shared` -> Constants, configuration, and functions that can be used either server or client side (isomorphic)
`/src/client` -> Helpers, components, elements, and functions used excludeively in client-side JS and Preact components
`/src/types` -> Entity types by domain
`/src/ui` -> Front-end UI elements and patterns, using @hyperspan/html templates, typically rendered on the server

### Hyperspan Routes

Hyperspan routes should return an HTML template, optionally wrapped in a layout. HTML templates can contain static content, or Promises in them that will stream the page and resolve when their async work is done. In general, prefer showing the page structure, heading, etc. immediately and then stream in any content that requires a query or other data fetching.

Example:

```
import { html, placeholder } from '@hyperspan/html';
import { createRoute } from '@hyperspan/framework';
import { requireActiveOrgUser } from '~/src/server/auth/app/get-active-org';
import { listClients } from '~/src/server/db/queries/clients';

export default createRoute().get(async (c) => {
  // Await anything required to display any part of the page (auth, user, validation, etc.)
  const { org: activeOrg } = await requireActiveOrgUser(c);

  // This template with static content will be sent immediately
  return html`
    <div>
      <h1>Clients</h1>

      <!-- this content will stream in when ready -->
      ${placeholder(html`<div class="skeleton"></div>`, renderClientList(activeOrg))}
    </div>
  `;
});

// Put any other content fetching into separate functions, then call them in the template without `await`
async function renderClientList(activeOrg) {
  return await listClients(activeOrg.id);
}
```

This example will trigger a streaming response from Hyperspan since there are unresolved Promise values in the template. The static content will be sent immedaitely to the user, and the rest of the content will stream in and render when resolved. This results in quicker page transitions and a faster feeling website for end users since the page content on the screen changes immediately. Use this approach ESPECIALLY for dashboards where lots of data fetching happens so that none of it holds up the page response from the server.

### Use Hyperspan Actions For All Form Submissions

When using Actions, the Hyperspan framework automatically wraps the HTML returned from createAction().form() in a Web Component <hs-action>. This Web Component handles form submission and replaces the action content in-place using fetch() and Idiomorph. A successful form submission can return HTML template content from the .post() handler or perform a redirect. An unsuccessful submission will re-display the content of .form() back to the user, along with any error messages either from a Zod validation failure, or from errors thrown in the .post() handler.

Rules:

- Should use createAction() from @hyperspan/framework/actions for files in app/actions
- Should NOT use createRoute() for files in app/actions. Routes go in app/routes.
- Prepend files and folders with a double-underscore if they do not export an action or route to prevent errors when starting the web server (these files will be skipped over when loading actions and routes = useful for files co-located with an action or route that are not the action or route itself, like form partials or utilities specific to that action or route).
- As much work as possible should be done on the server, using HTML templates from @hyperspan/html.
- Use DaisyUI elements to provide better structure and make forms look nicer.
- Use standard HTML form inputs with appropriate types and validation attributes.
- MINIMIZE client JavaScript as much as possible. JavaScript spinkles for enhancement, not entire forms.
- Actions can be composed inside other actions when required. This can be useful for things like multi-step forms.
- Actions can be rendered wherever needed by importing them and using the `.render()` method.
- Data can be passed into actions when rendered with `.render({ data: { foo: 'bar', bar: 'baz' }})`. This can be useful to pass in things like the current item ID, organization or team ID, etc. or any existing data for editing an item with the same form as adding it.

When and how to use embedded Preact components:

- ONLY when advanced client-side functionality is required, for instance adding and removing line items or fields dynamically without a page reload.
- Use renderPreactIsland() from @hyperspan/plugin-preact to render these extra fields in-line, inside the HTML template from the action.
- ONLY use Preact for the fields and sections that require it - NOT usually the whole action form.
- Output standard HTML form inputs and elements in Preact, and handle them in the action .post() handler.
- If an array of data is required, use nested bracket syntax for field names: "contact[0][name]" and "contact[0][email]", etc. Hyperspan will automatically turn these fields into an array of objects for the `data` parameter in the `.post()` handler. Simple arrays can use a field name like "tags[]".
- If an object is required, use bracket syntax with names for fields, like: "user[name]" and "user[email]". data.user -> `{ name: string, email: string }`
- Do NOT wire up any other form handling or client JS API fetches unless the user explicitly asks for it. Rely on Hyperspan handling the form and do as much processing and validation on the server as possible, even when Preact components are embedded.
- Prefer multiple embedded Preact islands over making the entire form in Preact.
