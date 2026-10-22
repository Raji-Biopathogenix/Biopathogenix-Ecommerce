# Homepage design update

Implemented from the supplied measurements, using 1440 CSS pixels as the desktop document-width baseline. The desktop measurement rules apply from 1280px; smaller layouts retain flexible widths and their existing breakpoints.

## Files changed

- `app/(shop)/page.tsx`: load Poppins 400, 500, 600, 700 and scope it to the homepage, navigation, and footer.
- `app/(shop)/HomePage.module.css`: homepage-only typography, dimensions, spacing, and responsive adjustments.
- `components/home2/HeroCarousel.tsx`: photo-group positioning hook and 6px adjustment at intermediate desktop widths.
- `components/home2/Primaryconversionpathways.tsx`: validation grid and button styling hooks.
- `components/home2/HighPerformanceMultiplex.tsx`: measured team-heading styling hook.
- `components/home2/Supportingscientificcommunity.tsx`: photo, copy, heading, and button styling hooks.
- `components/home2/Productcatalogbanner.tsx`: heading, artwork, copy, and download-button styling hooks; use loaded regular font weight.

## CSS targets applied

These are source-level targets, not browser-measured results.

| Element | Target |
| --- | --- |
| Homepage typeface | Poppins, with mixed heading weights/colors retained |
| Hero microscope | Existing 316.81 × 320.90 shape retained |
| Hero tubes | Existing 340.17 × 355.34 shape retained |
| Hero notes | Existing 215.34 × 246.14 shape retained |
| Hero shape borders | Existing 8px white borders and rounded hexagon paths retained |
| Header icons | 40 × 40, 6px horizontal gaps |
| Validation cards | 298 × 267, 14px horizontal/13px vertical gaps; 610 × 547 grid |
| Validation grid spacing | Top section padding reduced by 61px; grid aligned to top of copy |
| QC button | 432 × 59, 8px radius, #0C558A, 28px horizontal/18px vertical padding, 34px gap |
| Community photo | 720 × 770 at 1440px, 40px clipping radius, object-fit cover |
| Community heading | 400px wide, 58px size, 60.9px line height, -2.9px tracking; #012C56/#4398CC |
| Community copy alignment | 96px inset from right column, 106px inset from image top |
| Learning Center button | 432 × 59, 8px radius, #0C558A |
| Catalog heading | 627px wide, 84px size/line height, -5.88px tracking, regular/semibold white/#4398CC spans |
| Download button | 331 × 59, 8px radius, #3E97CE, 28px horizontal/18px vertical padding, 34px gap |
| Catalog background | Existing #012C56 and visible 40px bottom corners retained |
| Team heading | Semibold, 20px size, 33px line height, -0.2px tracking, 574px width |

Header alignment uses a centered 1240px inner area: at 1440px the icon containers are positioned by layout at X 1208/1254/1300. The 8px header strip plus a 100px navigation row places them at Y 38. The hero group compensates for the header height so its microscope shape retains the Y 159 reference.

## Verification and review limits

- TypeScript passed.
- Focused ESLint completed with zero errors and four existing Next.js `<img>` optimization warnings.
- Local homepage returned HTTP 200.
- Final production build passed, including all homepage CSS refinements.
- No connected browser is available. Actual 1440px, tablet, and mobile screenshot/overflow comparisons have not been performed.
- Figma could not be opened using the available web tool. Exact X/Y positions, total page height, heading wrapping, and photo crop remain unverified.
- The catalog asset is a 1932 × 2562 portrait cover. Its aspect ratio and existing 590px desktop image cap are retained. It has not been stretched to the 843 × 687 artwork-group bounds; the complete group composition needs Figma inspection.
- Existing text, routes, navigation actions, category hover behavior, cart, search, account, and catalog download bindings were preserved.
- Changes are local and have not been committed or pushed.
