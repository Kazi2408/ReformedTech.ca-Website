# Imam Mohammad Inam Ul Haq — homepage prototypes

These are four homepage prototypes, one for each approved hero direction (A, B, C and D). Each file is self-contained: open it straight in a browser. There's no build step, no paid dependencies and no API keys.

| File | Direction | Leads with |
|---|---|---|
| `concept-a-midnight-aurora.html` | **A — Midnight Aurora**: deep navy, moving teal/violet light, saffron accents | Lectures, with the portrait in an arch-shaped frame |
| `concept-b-emerald-geometry.html` | **B — Emerald Geometry**: emerald and cream, geometric star pattern, copper-gold | Arabic learning, with clickable steps in the hero |
| `concept-c-desert-dusk.html` | **C — Desert Dusk**: sunset gradient, editorial serif type | The archive, with search right in the hero |
| `concept-d-gilded-noir.html` | **D — Gilded Noir**: black and gold, Bodoni type, gold rosette that draws itself in | The Imam's name and identity, styled as a luxury editorial |

## 3D and motion (shared across all four)
- **Scroll reveals:** sections rise, slide or flip into view as you scroll.
- **3D tilt:** cards tilt toward the mouse, with a soft spotlight that follows the pointer.
- **3D book:** *Arabic Made Easy* is shown as a 3D book with a spine and page edges. It sways gently.
- **Parallax:** background glows move at different speeds as you scroll.
- **Progress bar:** a thin bar at the top shows how far down the page you are.
- **Per-direction motion:**
  - A: aurora drift, a turning colour ring around the portrait, a timeline line that draws itself in.
  - B: a slowly moving star pattern, shimmering headline text, Arabic letters cycling inside a disc, a rotating geometric frame.
  - C: twinkling stars, a rising sun glow, fanned 3D cards in the hero, a staircase of learning steps.
  - D: a gold rosette that draws itself in, shimmering gold headline text, two scrolling bands of topic words.
- **Reduced motion:** visitors whose system is set to reduce motion get a calm, fully visible page with all animation off.

## How to review
1. **Switch language:** use the **العربية / English** button in the header or footer. The whole page switches to Arabic (right-to-left). The choice is remembered when browser storage is available. Adding `?lang=ar` to the URL opens the page in Arabic directly.
2. **Test the archive:** type in the archive search, for example `Arabic`, `quran` or `قرآن`. Then combine a content-type chip with the Topic menu, try **Clear filters**, and search for nonsense such as `zzzz` to see the empty state.
3. **Test the forms:** the forms check your input in the browser. Choose **Speaking invitation** to reveal the extra fields (organisation, date, format). Submitting only shows "This is a prototype. Your enquiry has not been sent."

## Adding the portrait and book cover
Put the files in `assets/` using these exact names:
- `assets/portrait.jpg`
- `assets/arabic-made-easy-cover.jpg`

Every prototype picks them up automatically. Until then, each one shows a clearly labelled placeholder. Images are never mirrored in Arabic, and the cover is shown whole on the front of the 3D book.

## Needs client approval before launch
- **Arabic text:** the Arabic spelling of the name (**الإمام محمد إنعام الحق**) and all Arabic interface text are draft translations.
- **Biography line:** "approximately three decades of teaching and lectures" and the MCC affiliation wording.
- **Book title:** it is kept in English in both languages until the exact Arabic lettering on the cover is confirmed.
- **Learning stages:** the three stages are labelled as a *proposed pathway*. They are not a confirmed curriculum.
- **Sample content:** all archive records, articles, events and resources are labelled samples or proposals.

## Buttons that stand in for future inner pages
These open a prototype window that explains the future page:
- About the Imam
- Learn Arabic
- Lecture & Media Archive
- Articles & Reflections
- Books & Publications and Book Details
- Events and Past Events
- Resources & Downloads
- Quran Translation Initiative
- Media & Interviews
- Privacy, Terms and Accessibility

These buttons scroll to the contact form with the right enquiry type already chosen:
- Invite to Speak
- Register Interest
- Enquire About Availability

## Recommended future pages (not built)
1. About the Imam
2. Learn Arabic
3. Lecture & Media Archive
4. Articles & Reflections
5. Books & Publications
6. Events & Speaking
7. Resources & Downloads
8. Contact / Invite to Speak
9. Quran Translation Initiative
10. Media & Interviews

## Editing
The published files are generated from `_src/`:
- `data.js`: translations, sample records and future-page text
- `core.js`: interactions and motion
- `base.css`: shared styles
- `partials/`: shared blocks of page code
- `*.src.html`: one template per direction

Rebuild with:

    python3 prototypes/imam-inam-ul-haq/_src/build.py

The build also checks for broken links, duplicate IDs, inline event handlers and undefined future-page windows.

This is a personal website prototype. It is not owned, operated or endorsed by the Muslim Council of Calgary.
