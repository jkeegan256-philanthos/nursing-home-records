# Visual tenets: the yardstick for the page-by-page series

Adopted 2026-09-11 by founder direction: improve one page at a time,
aimed at research-backed readability, flow, and comprehension rather
than fashion. Every change in the series names the tenet it serves,
so the work stays accountable to something other than taste.

These tenets are chosen defaults from the typography and reading
literature, not measurements of this site. 45 to 90 characters came
from Bringhurst and the W3C's guidance, not from testing here; the
same discipline as the 700 KB threshold, stated so a future reader
knows which numbers were inherited and which were earned.

1. **Measure.** Every text surface holds 45 to 90 characters per
   line (Bringhurst's 45-75 ideal; W3C WCAG guidance near 80). A
   line that runs the container is not a design, it is an absence of
   one.
2. **One scale, each size one role.** Few font sizes, differences
   large enough to perceive. Sizes half a pixel apart cannot carry
   hierarchy; they are noise wearing precision's badge (Butterick,
   Practical Typography).
3. **Hierarchy by size, weight, and space; never by grey alone, and
   grey never marks important text.** Grey is for metadata. A page's
   introduction and its thesis sentence read in ink.
4. **Line-height 1.4 to 1.6 for body text.** Tighter for headings.
5. **Proximity groups.** Space binds a heading to its content and
   separates it from the section above; related things sit closer
   than unrelated things (the Gestalt proximity principle).
6. **Contrast at least WCAG AA** (4.5:1 body, 3:1 large). This site
   already passes everywhere (ink 15.96:1, faint 5.69:1 on paper);
   the tenet is here so it stays true.
7. **The charter rider.** Every typographic emphasis rule is
   uniform. Nothing in this series may make one name, one facility,
   or one row more visible than its peers; whatever pattern exists
   reveals itself, it is never pointed at.

Method: one page per pass, one pass per PR. Each pass opens with a
measured audit of that page, names the tenet behind each change, and
delivers before/after renders at 1280 and 400 for a ruling before
merge. What a pass finds but cannot fix inside its page is named as
deferred, not left to be rediscovered.
