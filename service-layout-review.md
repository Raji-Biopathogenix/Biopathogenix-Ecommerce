# Service-page spacing refinement

Updated files:

- `app/services/assay-development/assay-development.module.css`
- `components/validation-services/ValidationPage.module.css`

The new spacing rules apply from 1280px upward. Existing heading widths, typography, colors, and smaller-screen rules are preserved. No transforms, new absolute positioning, fixed page heights, or content clipping were added.

## Horizontal alignment

The supplied Assay Development coordinates are consistent with a 1440px document content width and a 1455px viewport including a 15px scrollbar:

- Custom heading: `720 + 1455 × .0555 = 800.7525`.
- Documentation heading: `720 + 1455 × .0465 = 787.6575`.
- Form: `1440 - 1455 × .1056 - 581 + 53 = 758.352`.

Desktop insets are now independent of viewport-unit scrollbar differences: 69px for Custom Assays, 67px for Documentation, and 152px on the right of the contact layout. These produce X 789, 787, and 760 respectively at a 1440px document content width.

## Vertical alignment

The following are calculated expectations based on the user's current measurements and the CSS flow adjustments. They are **not browser remeasurements**.

| Page / element | Target Y | Calculated expectation |
| --- | ---: | ---: |
| Assay / Custom heading | 1078 | 1078 |
| Assay / Standard heading | 1788 | 1788 |
| Assay / Documentation heading | 3352 | 3352 |
| Assay / Inquiry heading | 3993 | 3993 |
| Assay / Form | 4057 | 4056.99 |
| Assay / Final CTA heading | 4918 | 4917.99 |
| Validation / Hero heading | 204.12 | 204.12 |
| Validation / Infrastructure heading | 1781.60 | 1781.60 |
| Validation / Partners heading | 4668.78 | 4668.78 |
| Validation / Testimonials heading | 5568.82 | 5568.82 |

Standard Assays exchanges 27.81px of bottom padding for top padding, keeping its total section height stable. Centered Custom and Documentation copy use small top-padding changes to adjust alignment within their existing panels. Contact gains 16px above it; the heading-to-form interval becomes 64px. The final CTA gains 50px of preceding margin after accounting for the contact-height correction.

The form keeps its 475px width, 18px row gap, labels, control heights, and resizable textarea. At desktop its textarea is now block-level, eliminating the inline baseline gap. The existing rows total approximately 539px without that gap; no fixed form height is imposed, so success/error feedback can expand it.

Validation's hero copy gains 4.12px of top padding within its existing stage. Infrastructure gains 32.21px of upper padding. Performance loses 14.07px of bottom padding, leaving the required net 18.14px shift for Partners. Testimonials gains the remaining 0.18px in its own upper padding.

## Approved carousels

Both approved components, shared UI components, inherited font configuration, and all existing validation stylesheet rules were compared against Git and remain unchanged. New selectors target editable sections only. The approved carousels can move with the surrounding document flow.

## Verification and remaining limits

- TypeScript passed.
- Focused ESLint passed with no warnings or errors.
- Production build passed.
- Both local service pages returned HTTP 200.
- Protected carousel source and stylesheet preservation checks passed.
- No connected browser was available (`apps: []`, `browsers: []`). Actual 1440px document-width remeasurement and mobile/tablet overflow checks could not be performed.
- Remaining discrepancies: actual rendered coordinates, subpixel rounding, and responsive overflow remain unverified. The calculated form/CTA Y values differ from the targets by approximately 0.01px before browser rounding.
- Changes are local and have not been pushed.
