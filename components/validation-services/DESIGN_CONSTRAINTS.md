# Approved carousel exceptions

The user approved the supplied screenshots for these entire sections:

- `ValidationSuccessfulSection.tsx`: "What a Successful Validation Looks Like"
- `ValidationDifferenceSection.tsx`: "What Makes BioPathogenix Different"

Preserve the existing implementation, including all descendants, at every breakpoint. Do not apply general Figma typography or spacing corrections to either section. The Difference heading is explicitly included in this exception.

Preserve card dimensions, gaps, padding, corner radii, typography, wrapping, colors, copy, photos, gradients, overlays, crops, horizontal layout, partially visible cards, numbering, navigation, carousel logic, and responsive behavior.

Both sections use shared classes from `ValidationPage.module.css`, shared components from `ValidationUi.tsx`, and the Poppins font inherited from `ValidationLandingPageContent.tsx`. Changes to `.page`, `.h2`, `.lead`, `.button`, `.checkList`, `.navButtons`, `.navButton`, CSS variables, inherited typography, resets, and shared media queries can therefore change the approved carousels even if their component files are untouched.

Scope subsequent corrections to individual editable sections: hero, infrastructure, performance, partners, testimonials, and bottom CTA. If a shared style needs correction elsewhere, add a section-specific override or new class rather than changing the carousel's computed styles. Do not change global typography or page-wide inherited values as part of those corrections.

The homepage corrections in `app/(shop)/HomePage.module.css` are confined to its local `.page` and homepage-specific header/footer conditions. Keep that scope; do not broaden them to global heading or service-page selectors.

Service-page references supplied by the user:

- Assay Development: Figma node `38079-13`.
- Validation Services: Figma node `38072-13`.
- File: `PnBgzZQyRY7vgBr3zXFxSN/Davron-Bowman-Biopathogenix---Design-Work--Copy-`.

The verified service-page typography and widths are implemented using section-specific selectors. Figma remains inaccessible through the available tool, so preserve other unverified service-page values. The earlier homepage measurements must not be applied to these pages.
