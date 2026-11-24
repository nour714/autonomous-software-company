# Frontend XSS Vulnerability Scanning & Remediation Reference

Comprehensive guide for detecting, classifying, and remediating Cross-Site Scripting (XSS) vulnerabilities across React, Vue, Angular, and vanilla browser JavaScript.

---

## 1. Dangerous Sinks & Untrusted Sources

### High-Risk DOM & Framework Sinks
- **HTML Manipulation**: `innerHTML`, `outerHTML`, `document.write`, `document.writeln`, `insertAdjacentHTML`.
- **Framework Escape Hatches**: React `dangerouslySetInnerHTML`, Vue `v-html`, Angular `[innerHTML]` bypasses (`bypassSecurityTrustHtml`).
- **URL & Navigation Sinks**: `location.href`, `location.assign`, `location.replace`, `window.open`, `<a href>`, `<iframe src>` when assigned untrusted strings (`javascript:`, `data:text/html`).
- **Code Execution Sinks**: `eval`, `new Function`, `setTimeout(string)`, `setInterval(string)`.

### Common Untrusted Sources
`props`, `state`, URL `searchParams` / `location.hash`, `postMessage` event data, user `input` / `formData`, API responses containing unvalidated user text, and `localStorage` / `sessionStorage` values when shared or mutated.

---

## 2. Framework-Specific Remediation Patterns

### Vanilla JS (Plain Text vs. Rich HTML)
```typescript
// SECURE: Use textContent for plain text
element.textContent = userInput;

// SECURE: Sanitize HTML with DOMPurify when rich markup is genuinely required
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

### URL Protocol Validation
```typescript
// SECURE: Allow only safe http/https protocols
function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    if (['http:', 'https:'].includes(parsed.protocol)) {
      return parsed.href;
    }
  } catch {
    // Reject malformed URLs
  }
  return '#';
}
```

### React / Vue / Angular
- **React**: Rely on default JSX escaping (`<div>{userInput}</div>`). Never pass raw input to `dangerouslySetInnerHTML` without `DOMPurify.sanitize(...)`.
- **Vue**: Prefer `{{ userInput }}` or `v-text`; if `v-html` is unavoidable, sanitize input via `DOMPurify.sanitize(...)` first.
- **Angular**: Rely on built-in `DomSanitizer`; avoid `bypassSecurityTrust*` methods unless strictly proven safe.

---

## 3. Automated Scanning Commands

```bash
# ESLint security rules
npx eslint . --plugin security

# Semgrep XSS ruleset
semgrep --config=p/xss --json
```

---

## 4. XSS Prevention Checklist
- [ ] Zero raw `innerHTML`, `outerHTML`, or `document.write` calls with untrusted data.
- [ ] All URL assignments (`href`, `src`, `location.*`, `window.open`) reject `javascript:` and `data:` schemes.
- [ ] Inline event handler strings avoided; `addEventListener` used consistently.
- [ ] `dangerouslySetInnerHTML` / `v-html` gated by `DOMPurify.sanitize()` and explicit review.
- [ ] Strict Content Security Policy (CSP) deployed (nonce-based `script-src`, no `unsafe-inline` / `unsafe-eval`).
- [ ] Regression test added verifying `<script>` and `onerror=` payloads are neutralized or escaped.
