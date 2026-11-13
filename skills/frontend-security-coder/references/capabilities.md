# Deep Technical Capabilities

## Capabilities

### Output Handling and XSS Prevention
- **Safe DOM manipulation**: textContent vs innerHTML security, secure element creation and modification
- **Dynamic content sanitization**: DOMPurify integration, HTML sanitization libraries, custom sanitization rules
- **Context-aware encoding**: HTML entity encoding, JavaScript string escaping, URL encoding
- **Template security**: Secure templating practices, auto-escaping configuration, template injection prevention
- **User-generated content**: Safe rendering of user inputs, markdown sanitization, rich text editor security
- **Document.write alternatives**: Secure alternatives to document.write, modern DOM manipulation techniques

### Content Security Policy (CSP)
- **CSP header configuration**: Directive setup, policy refinement, report-only mode implementation
- **Script source restrictions**: nonce-based CSP, hash-based CSP, strict-dynamic policies
- **Inline script elimination**: Moving inline scripts to external files, event handler security
- **Style source control**: CSS nonce implementation, style-src directives, unsafe-inline alternatives
- **Report collection**: CSP violation reporting, monitoring and alerting on policy violations
- **Progressive CSP deployment**: Gradual CSP tightening, compatibility testing, fallback strategies

### Input Validation and Sanitization
- **Client-side validation**: Form validation security, input pattern enforcement, data type validation
- **Allowlist validation**: Whitelist-based input validation, predefined value sets, enumeration security
- **Regular expression security**: Safe regex patterns, ReDoS prevention, input format validation
- **File upload security**: File type validation, size restrictions, virus scanning integration
- **URL validation**: Link validation, protocol restrictions, malicious URL detection
- **Real-time validation**: Secure AJAX validation, rate limiting for validation requests

### CSS Handling Security
- **Dynamic style sanitization**: CSS property validation, style injection prevention, safe CSS generation
- **Inline style alternatives**: External stylesheet usage, CSS-in-JS security, style encapsulation
- **CSS injection prevention**: Style property validation, CSS expression prevention, browser-specific protections
- **CSP style integration**: style-src directives, nonce-based styles, hash-based style validation
- **CSS custom properties**: Secure CSS variable usage, property sanitization, dynamic theming security
- **Third-party CSS**: External stylesheet validation, subresource integrity for stylesheets

### Clickjacking Protection
- **Frame detection**: Intersection Observer API implementation, UI overlay detection, frame-busting logic
- **Frame-busting techniques**: JavaScript-based frame busting, top-level navigation protection
- **X-Frame-Options**: DENY and SAMEORIGIN implementation, frame ancestor control
- **CSP frame-ancestors**: Content Security Policy frame protection, granular frame source control
- **SameSite cookie protection**: Cross-frame CSRF protection, cookie isolation techniques
- **Visual confirmation**: User action confirmation, critical operation verification, overlay detection
- **Environment-specific deployment**: Apply clickjacking protection only in production or standalone applications, disable or relax during development when embedding in iframes

### Secure Redirects and Navigation
- **Redirect validation**: URL allowlist validation, internal redirect verification, domain allowlist enforcement
- **Open redirect prevention**: Parameterized redirect protection, fixed destination mapping, identifier-based redirects
- **URL manipulation security**: Query parameter validation, fragment handling, URL construction security
- **History API security**: Secure state management, navigation event handling, URL spoofing prevention
- **External link handling**: rel="noopener noreferrer" implementation, target="_blank" security
- **Deep link validation**: Route parameter validation, path traversal prevention, authorization checks

### Authentication and Session Management
- **Token storage**: Secure JWT storage, localStorage vs sessionStorage security, token refresh handling
- **Session timeout**: Automatic logout implementation, activity monitoring, session extension security
- **Multi-tab synchronization**: Cross-tab session management, storage event handling, logout propagation
- **Biometric authentication**: WebAuthn implementation, FIDO2 integration, fallback authentication
- **OAuth client security**: PKCE implementation, state parameter validation, authorization code handling
- **Password handling**: Secure password fields, password visibility toggles, form auto-completion security

### Browser Security Features
- **Subresource Integrity (SRI)**: CDN resource validation, integrity hash generation, fallback mechanisms
- **Trusted Types**: DOM sink protection, policy configuration, trusted HTML generation
- **Feature Policy**: Browser feature restrictions, permission management, capability control
- **HTTPS enforcement**: Mixed content prevention, secure cookie handling, protocol upgrade enforcement
- **Referrer Policy**: Information leakage prevention, referrer header control, privacy protection
- **Cross-Origin policies**: CORP and COEP implementation, cross-origin isolation, shared array buffer security

### Third-Party Integration Security
- **CDN security**: Subresource integrity, CDN fallback strategies, third-party script validation
- **Widget security**: Iframe sandboxing, postMessage security, cross-frame communication protocols
- **Analytics security**: Privacy-preserving analytics, data collection minimization, consent management
- **Social media integration**: OAuth security, API key protection, user data handling
- **Payment integration**: PCI compliance, tokenization, secure payment form handling
- **Chat and support widgets**: XSS prevention in chat interfaces, message sanitization, content filtering

### Progressive Web App Security
- **Service Worker security**: Secure caching strategies, update mechanisms, worker isolation
- **Web App Manifest**: Secure manifest configuration, deep link handling, app installation security
- **Push notifications**: Secure notification handling, permission management, payload validation
- **Offline functionality**: Secure offline storage, data synchronization security, conflict resolution
- **Background sync**: Secure background operations, data integrity, privacy considerations

### Mobile and Responsive Security
- **Touch interaction security**: Gesture validation, touch event security, haptic feedback
- **Viewport security**: Secure viewport configuration, zoom prevention for sensitive forms
- **Device API security**: Geolocation privacy, camera/microphone permissions, sensor data protection
- **App-like behavior**: PWA security, full-screen mode security, navigation gesture handling
- **Cross-platform compatibility**: Platform-specific security considerations, feature detection security

