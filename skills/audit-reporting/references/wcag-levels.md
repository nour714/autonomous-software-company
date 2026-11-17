# WCAG Levels & Standards Reference

Authoritative mapping of Web Content Accessibility Guidelines (WCAG) criteria, versions, and compliance levels (A, AA, AAA).

> [!IMPORTANT]
> **Reporting Rule:** All accessibility audit reports must cite both the exact WCAG version and compliance level (e.g., *WCAG 2.2 Level AA* or *WCAG 2.1 Level AAA*). Never report a Level AAA criterion as a Level AA failure.

---

## WCAG Criteria Standards Table

# TODO(verify) against official W3C specification recommendations (https://www.w3.org/WAI/standards-guidelines/wcag/)

| Criterion | Name | Version Introduced | Level | Key Requirement |
|---|---|:---:|:---:|---|
| **1.1.1** | Non-text Content | WCAG 2.0 | **A** | Provide text alternatives for non-text content. |
| **1.2.1** | Audio-only and Video-only (Prerecorded) | WCAG 2.0 | **A** | Alternative for prerecorded media. |
| **1.2.2** | Captions (Prerecorded) | WCAG 2.0 | **A** | Captions provided for prerecorded audio. |
| **1.3.1** | Info and Relationships | WCAG 2.0 | **A** | Semantic structure conveyed through markup. |
| **1.3.2** | Meaningful Sequence | WCAG 2.0 | **A** | Reading order is programmatically determined. |
| **1.3.3** | Sensory Characteristics | WCAG 2.0 | **A** | Instructions do not rely solely on shape/color/location. |
| **1.3.4** | Orientation | WCAG 2.1 | **AA** | Content does not restrict view to single orientation. |
| **1.3.5** | Identify Input Purpose | WCAG 2.1 | **AA** | Purpose of input fields programmatically determinable. |
| **1.4.1** | Use of Color | WCAG 2.0 | **A** | Color is not the sole visual means of conveying info. |
| **1.4.2** | Audio Control | WCAG 2.0 | **A** | Mechanism to pause/stop audio playing > 3 seconds. |
| **1.4.3** | Contrast (Minimum) | WCAG 2.0 | **AA** | Contrast ratio at least 4.5:1 (3:1 for large text). |
| **1.4.4** | Resize Text | WCAG 2.0 | **AA** | Text can be resized up to 200% without loss of content. |
| **1.4.5** | Images of Text | WCAG 2.0 | **AA** | Use text rather than images of text where possible. |
| **1.4.6** | Contrast (Enhanced) | WCAG 2.0 | **AAA** | Contrast ratio at least 7:1 (4.5:1 for large text). |
| **1.4.10** | Reflow | WCAG 2.1 | **AA** | Content reflows without 2D scrolling down to 320px width. |
| **1.4.11** | Non-text Contrast | WCAG 2.1 | **AA** | UI components and graphics have at least 3:1 contrast. |
| **1.4.12** | Text Spacing | WCAG 2.1 | **AA** | No loss of content when line height and spacing adjusted. |
| **1.4.13** | Content on Hover or Focus | WCAG 2.1 | **AA** | Pointer hover or focus content dismissible, hoverable, persistent. |
| **2.1.1** | Keyboard | WCAG 2.0 | **A** | All functionality operable through keyboard interface. |
| **2.1.2** | No Keyboard Trap | WCAG 2.0 | **A** | Keyboard focus can be moved away from component. |
| **2.1.4** | Character Key Shortcuts | WCAG 2.1 | **A** | Single-key shortcuts can be turned off or remapped. |
| **2.2.1** | Timing Adjustable | WCAG 2.0 | **A** | User can turn off, adjust, or extend time limits. |
| **2.2.2** | Pause, Stop, Hide | WCAG 2.0 | **A** | Moving, blinking, or scrolling content can be paused. |
| **2.4.1** | Bypass Blocks | WCAG 2.0 | **A** | Mechanism to bypass repeated navigation blocks (skip links). |
| **2.4.2** | Page Titled | WCAG 2.0 | **A** | Web pages have descriptive, unique titles. |
| **2.4.3** | Focus Order | WCAG 2.0 | **A** | Focusable components receive focus in meaningful order. |
| **2.4.4** | Link Purpose (In Context) | WCAG 2.0 | **A** | Purpose of each link can be determined from link text or context. |
| **2.4.6** | Headings and Labels | WCAG 2.0 | **AA** | Headings and labels describe topic or purpose. |
| **2.4.7** | Focus Visible | WCAG 2.0 | **AA** | Any keyboard operable interface has a visible focus indicator. |
| **2.4.11** | Focus Appearance | WCAG 2.2 | **AAA** | Focus indicator has area and contrast >= 3:1. |
| **2.4.12** | Focus Not Obscured (Minimum) | WCAG 2.2 | **AA** | When item receives focus, it is not entirely obscured by content. |
| **2.4.13** | Focus Not Obscured (Enhanced) | WCAG 2.2 | **AAA** | No part of the focused component is hidden by author content. |
| **2.5.1** | Pointer Gestures | WCAG 2.1 | **A** | Multipoint or path-based gestures have single-pointer alternative. |
| **2.5.2** | Pointer Cancellation | WCAG 2.1 | **A** | Function executes on up-event, with abort/undo option. |
| **2.5.3** | Label in Name | WCAG 2.1 | **A** | Visual text label matches accessible name. |
| **2.5.5** | Target Size (Enhanced) | WCAG 2.1 | **AAA** | Target size for pointer inputs is at least 44 by 44 CSS pixels. |
| **2.5.7** | Dragging Movements | WCAG 2.2 | **AA** | Dragging actions have single-pointer alternatives. |
| **2.5.8** | Target Size (Minimum) | WCAG 2.2 | **AA** | Target size at least 24 by 24 CSS pixels, or spacing offset. |
| **3.1.1** | Language of Page | WCAG 2.0 | **A** | Default human language of Web page programmatically determinable. |
| **3.2.1** | On Focus | WCAG 2.0 | **A** | Receiving focus does not trigger an unexpected context change. |
| **3.2.2** | On Input | WCAG 2.0 | **A** | Changing input setting does not trigger unexpected context change. |
| **3.3.1** | Error Identification | WCAG 2.0 | **A** | Input error detected, identified, and described to user in text. |
| **3.3.2** | Labels or Instructions | WCAG 2.0 | **A** | Labels or instructions provided when content requires user input. |
| **3.3.3** | Error Suggestion | WCAG 2.0 | **AA** | Suggestions for error correction provided if known. |
| **3.3.7** | Redundant Entry | WCAG 2.2 | **A** | Previously entered info auto-populated or available for selection. |
| **3.3.8** | Accessible Authentication (Minimum) | WCAG 2.2 | **AA** | No cognitive function test required without alternatives/assistance. |
| **4.1.1** | Parsing (Obsolete) | WCAG 2.0 | **A** | Obsoleted in WCAG 2.2 (handled by HTML specification). |
| **4.1.2** | Name, Role, Value | WCAG 2.0 | **A** | Controls have programmatic name, role, state, and value. |
| **4.1.3** | Status Messages | WCAG 2.1 | **AA** | Status messages programmatically determinable via ARIA live regions. |

---

## Common Verification Misconceptions

1. **Target Size 2.5.5 vs 2.5.8:**
   - 2.5.5 is **WCAG 2.1 Level AAA** (requires 44x44px).
   - 2.5.8 is **WCAG 2.2 Level AA** (requires 24x24px).
   - Calling a 32px button a failure under Level AA is false unless evaluating under WCAG 2.2 and spacing is insufficient. Under WCAG 2.1, 44px is strictly Level AAA.
2. **Contrast 1.4.3 vs 1.4.6:**
   - 1.4.3 (Level AA) requires 4.5:1 (3:1 for large text).
   - 1.4.6 (Level AAA) requires 7:1 (4.5:1 for large text).
   - A 5.5:1 ratio passes Level AA; it only fails if Level AAA compliance is explicitly claimed.
