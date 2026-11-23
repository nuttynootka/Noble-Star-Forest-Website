# Handoff: drop-down-animations — standalone "unrolling plates on chains" animation (2026-11-23)

Repo: `nuttynootka/Noble-Star-Forest-Website`. Work branch: **`drop-down-animations`**.
At handoff, `drop-down-animations` and `main` were both `d27f5f9` ("Initial commit": only
`README.md` and `.gitignore`), plus the commit that adds this file.
**No animation code has been written yet.** The user asked for this handoff before any coding.

## Status
- DONE: created branch `drop-down-animations` from `main` and pushed it (verified with
  `git ls-remote --heads origin`, 2026-11-23).
- DONE: read the existing header's plate and physics code on branch `retail-storefront`
  (commit `acb62e3`). The source files are listed under "Reference code" below.
- DONE: gathered the user's requirements (below). These are the user's own words, paraphrased only lightly.
- NOT STARTED: the engine, the React wrapper, the demo page, verification.
- NOT STARTED / DEFERRED BY THE USER: the closing animation ("Decide later").

## What the user wants (requirements, from the user)
1. **A standalone, reusable animation**, not a new drop-down menu. The user said:
   "Just the animating of the glass plates unrolling, and the animating of the plates swinging or
   swaying or twisting or bouncing or jiggling because of the way they are connected to each
   other via chains. That way this animation can be applied to other things too, not just the
   navigation header." Keep it as its own thing on this branch, based on `main`, **not** based on
   `retail-storefront`.
2. **Closed state:** rigid plates **rolled up like a carpet, with the roll facing the user**.
3. **Opening:** it **actually unrolls one plate at a time**. The **roll travels down**, like a carpet
   unrolled down a wall: the top plate stays attached under the anchor, and the shrinking roll
   drops lower as it leaves plates behind.
4. **After unrolling:** each plate swings **first back (away from the viewer), then closer to the
   user, then further away**, as if it had really just unrolled quickly. It also **bounces slightly
   and twists a little**. Each plate moves **separately**, yet **depends on the plate it is attached to**.
5. **Keep the short chains** between plates (and from the anchor to the first plate).
6. **Settle fully still.** The motion dies out naturally within about 2 seconds, then the
   simulation stops (no idle breeze).
7. **Keep the plate look exactly**: the frosted-glass, etched-text plates from the current header.
   The user loves how the plates look and dislikes only how they move.
8. Closing: **decide later**. A simple placeholder close is acceptable, clearly labelled as one.
9. The user expects "very complex and chaotic physics". Getting it fully natural will take several tuning rounds.

## Decisions (made by Claude, approved implicitly by the user's answers; revisit if the user objects)
- **A custom physics engine, not a library** (Rapier, cannon-es, etc.). Why: it is a small,
  specialised system (a handful of rigid plates and chains), and a general engine would be
  heavier and harder to tune for this one effect. This is Claude's opinion and the user has not
  explicitly approved it. The user's preferences say to ask about alternatives, and Claude stated
  this trade-off in chat with no objection.
- **Framework-free engine plus a thin React wrapper.** The engine drives any DOM elements
  (`HTMLElement[]`), so it can be reused beyond the header. The React wrapper matches the
  storefront stack (Next 16 / React 19 / TypeScript, from `retail-storefront`'s `package.json`).
- **Proposed folder:** `components/plate-unroll/`
  - `math.ts`: 3D vector helpers, plus rotation extraction for shape matching.
  - `engine.ts`: the `PlateChainEngine` class, with `open()`, `close()` (placeholder),
    `measure()`/`setGeometry()`, `setReducedMotion()`, and `destroy()`.
  - `UnrollingPlates.tsx`: the React wrapper, `<UnrollingPlates open>{plates}</UnrollingPlates>`.
  - `plate-unroll.css`: chain-link styling (copied from `.gh-chain`).
  - `demo/`: a demo page using copies of the plate styles so the result can be viewed.
- **Minimal tooling on this branch:** a `package.json` with devDeps `typescript`, `esbuild`,
  `react`, `react-dom`, `@types/react` and `@types/react-dom`, to type-check the code and bundle
  the demo. No Next.js and no Tailwind (the demo uses plain CSS copies of the plate classes).

## Proposed physics design (a plan, NOT verified, nothing built)
Coordinates: x = right, y = down (screen), z = toward the viewer. The container uses CSS
`perspective` and `transform-style: preserve-3d`.

- **Each plate is a rigid body made of 4 corner particles** (Verlet integration, about 180 Hz
  substeps, like the old engine). Rigidity comes from **shape matching**: after each constraint
  iteration, fit the best rigid rotation to the particles (Müller's quaternion rotation extraction)
  and snap the particles back onto the rest shape. Warning: plain 6-distance constraints on a flat
  quad are *not* rigid out of plane (the quad can bend along a diagonal), which is why shape
  matching is used.
- **Chains** are rope constraints (max-length only, slightly soft for bounce) from each plate's
  top attach points (left and right) to the parent plate's bottom attach points. The first plate
  hangs from 2 fixed anchor points. The old engine attached the top plate at 0.2 of its width
  from each side (`leadAttach`) and inner plates at 0.34 (`innerAttach`), with a gap of 15px.
- **The roll** (the closed state) is built with forward kinematics: plate k's direction in the
  y–z plane is `a0 + k·β`, curling toward +z (the viewer), with β ≈ 360°/N (bounded for large N,
  with a slight spiral radius shrink so inner layers don't overlap). Plate 0 is the outermost
  layer and plate N-1 is the core.
- **The roll stays rigid until each plate is released.** While locked, the unreleased plates are
  shape-matched as **one rigid cluster** (all their particles), so the roll has real mass and
  inertia.
- **Unrolling:** release hinge 0 (anchor to plate 0), then hinge 1, and so on. Releasing hinge k
  removes plate k-1 from the locked cluster. The rest of the roll then pivots and falls from
  plate k-1's bottom chains under gravity. That makes the roll travel down and produces the
  back/forward/back swing naturally. Release the next plate on a timer (about 0.08–0.12 s) and/or
  once the previous plate has swung near vertical, as the old `releaseFold` check did.
- **Twist and bounce:** a small random asymmetric push per plate at release causes the twist.
  With two chains, a bifilar (two-string) pendulum's restoring force brings it back. Soft chain
  stiffness gives the bounce and jiggle.
- **Settling:** linear and angular drag, then a sleep check (kinetic energy below a threshold for
  every plate). At that point, snap to rest and stop `requestAnimationFrame`. Final pose: plates
  hanging flat, facing the viewer.
- **Rendering:** for each plate, build a frame from its corners (x axis = top edge, y axis = side
  edge, z = cross product) and write a CSS `matrix3d(...)` with `transform-origin: 0 0`. Each
  chain is an element whose y axis runs from point A to point B (height = length), with its x
  axis chosen so the chain faces the camera.
- **Reduced motion** (`prefers-reduced-motion`): skip the simulation and show the plates hanging
  still (or fade them in).
- Rough sizes: plate height about 26–28px (`--menu-h`), width depending on the label. Gravity
  2200 px/s² in the old engine.

## Reference code (on branch `retail-storefront`, commit `acb62e3`)
Read with `git fetch origin retail-storefront && git show FETCH_HEAD:<path>`.
- `components/garland-header/GarlandHeader.tsx`
  - `HeaderPlate`: the plate markup the user loves (frost glass, etched label, glints).
  - `HeaderLadder`: how plates and chains are mounted into the old engine.
- `components/garland-header/physics.ts`
  - `LadderPhysics` and `LADDER_SPRING`: the OLD motion the user dislikes. Its behaviour:
    plates fold flat at -90° and hidden, drop one by one under gravity on chains, spring
    open, then sway forever in a fake breeze, get random kicks, and wobble on mouse-over.
  - Do **not** reuse its motion. Reuse ideas only: Verlet substepping, chain rendering.
- `components/garland-header/utils.ts`: `makeGlints`, `fnv1a`, `GLINT_COLORS` (the glint dots on plates).
- `app/globals.css`, lines about 159–280: `.gh-tiny`, `.gh-tiny-soft`, `.gh-frost-glass`,
  `.gh-etched`, `.gh-chain`, `.gh-menu-plate`. Plates also use Tailwind classes:
  `rounded-[6.5px] border border-white/20 bg-white/10 shadow-lg backdrop-blur-md`, with an
  outer `rounded-[8px] p-[1.5px]`. The font is Cuprum (`--gh-font`), semibold, uppercase,
  tracking 0.06em.

## Prework findings (2026-11-23, this session; verified by the method stated)
- Toolchain: Node v22.23.5 and npm 10.9.9. The npm registry is reachable (`npm view esbuild`
  returned 0.28.2, `npm view typescript` returned 7.0.2). Playwright loads. Browsers in
  `/opt/pw-browsers`: **Chromium only** (no WebKit/Safari, no Firefox). ffmpeg is present
  (`/opt/pw-browsers/ffmpeg-1011`), so the demo can be recorded to a video or GIF for the user.
- Google Fonts is reachable (HTTP 200 for the Cuprum CSS), so the demo can load Cuprum like the site does.
- **The rotation-fit algorithm is verified against a source.** Müller, Bender, Chentanez &
  Macklin, "A Robust Method to Extract the Rotational Part of Deformations", MIG 2016. The
  reference implementation is MuJoCo `src/engine/engine_util_spatial.c`, `mju_mat2Rot`, read
  2026-11-23. Each iteration: `omega = Σ cross(R·col_i, A·col_i) / (|Σ dot(R·col_i, A·col_i)| + ε)`,
  rotate the quaternion by `|omega|` about `omega/|omega|`, stop when `|omega| < ε`. Warm-start
  from last frame's quaternion, so 1–3 iterations per step are usually enough.
- **3D rendering probe** (throwaway files in the scratchpad, Chromium, viewed as screenshots):
  - `matrix3d` with `transform-origin: 0 0` inside a `perspective` + `preserve-3d` parent
    renders tilted, twisted and back-facing plates correctly.
  - `backdrop-filter: blur()` still blurs inside a preserve-3d context.
  - UNVERIFIED on Safari/iOS (no WebKit here). This matters less than it sounds: the plate face
    `.gh-frost-glass` is a 95%-opaque gradient (`#fffffff2` …), so little backdrop shows through.
- Plate anatomy (from `retail-storefront` `GarlandHeader.tsx` `HeaderPlate` + `globals.css`):
  - outer `.gh-menu-plate`: height `--menu-h` (26px, 28px at md and up), `p-[1.5px]`,
    `rounded-[8px]`, a metallic gradient `linear-gradient(#f6f8fb,#9aa3ad 40%,#e8edf2 62%,#7d8690)`,
    and a fake thickness from `box-shadow: 0 3px #5b636c, 0 5px #2b3036, 0 12px 20px #0000008c`.
  - inner span: `rounded-[6.5px] border-white/20 bg-white/10 backdrop-blur-md shadow-lg`, then
    the `.gh-frost-glass` overlay, then the `.gh-etched` label (Cuprum 600, uppercase,
    tracking 0.06em, `px-[7px]`, 12–14px).
  - 4 glint sparkles per plate (`.gh-tiny .gh-tiny-soft`, positions from `makeGlints(fnv1a(href))`,
    colour `--gc` from `GLINT_COLORS`).
  - The fake-thickness box-shadow only reads correctly from the front. When a plate tilts in 3D
    it will look like a flat sticker unless a real edge is added. This is a design question for
    the user (see the ideas list in chat).
- Real menu labels for the demo (`SiteShell.tsx` `NAV_PAGES`):
  - "Statement Trees", "Wholesale Trees", "Wreaths & Greenery", "Make Payment"
  - "Meet Us", "Contact Us", "Request Quote"

## Build plan (ordered; each step verified before the next)
1. `package.json` (private; devDeps typescript, esbuild, react, react-dom, @types/react,
   @types/react-dom; scripts `typecheck` = `tsc --noEmit`, `demo` = esbuild bundle) and
   `tsconfig.json` (strict). `npm install`.
2. `components/plate-unroll/math.ts`: vec3 and quaternion helpers, plus `extractRotation`
   (Müller 2016).
3. `components/plate-unroll/engine.ts`: `PlateChainEngine`.
   - Particles, rigid clusters (shape matching), rope chains, roll construction, the sequential
     release scheduler, drag, a sleep check, and `matrix3d` rendering for plates and chains.
   - All tunables live in one exported `UNROLL_PHYSICS` object.
   - `close()` is a clearly-labelled placeholder (an instant re-roll).
4. `components/plate-unroll/plate-unroll.css`: the chain-link style, a copy of `.gh-chain`.
5. `components/plate-unroll/UnrollingPlates.tsx`: the React wrapper (`open` prop, children = plates).
5b. **Visual enhancements, all five approved by the user on 2026-11-23.** The engine exposes
   each plate's live orientation and events, and CSS or the wrapper renders the effect:
   1. **Real glass thickness:** each plate gets a visible 3D edge in the metallic rim colours
      (`#5b636c` / `#2b3036`), seen when it tilts or rolls. This replaces reliance on the
      front-only fake-thickness box-shadow while the plate is in 3D. Approach: one edge slab
      element per side (bottom and top at least), placed with `matrix3d` from the plate frame
      offset by the thickness (about 3–5px) along the plate normal.
   2. **Light catching the glass:** a soft specular sheen slides across each plate as its angle
      changes. The engine writes CSS variables per plate each frame (for example `--nx`, `--ny`,
      `--nz` from the plate normal, plus a computed `--sheen` position and strength). A
      gradient overlay layer in the plate uses them. The light direction is configurable
      (default: from above and in front, like the star or fairy lights).
   3. **Shading in the roll:** plates facing away from the viewer darken slightly
      (`--face` = normal·view, driving a darkening overlay or `filter: brightness`), so the
      rolled carpet reads clearly as a 3D roll.
   4. **Mirrored lettering on the back:** keep `backface-visibility: visible` so the etched text
      reads backwards through the glass while rolled up. Optionally soften it on the back face
      (lower contrast) so it looks seen through frost.
   5. **A frost sparkle on unrolling:** when each plate is released and snaps open, the engine
      emits an `onPlateRelease(index)` callback / DOM event. The wrapper triggers a short burst
      using the existing glint sparkle style (`.gh-tiny .gh-tiny-soft`, `--gc` colours).
   All five respect reduced motion: sheen and shading stay static, and there is no sparkle burst.
6. `demo/`: the plates restyled with plain-CSS copies of the classes above, a dark forest
   background, and Open/Reset buttons. Bundle with esbuild.
7. Verify:
   - `npm run typecheck` is clean.
   - The Playwright frame strip (every 50 ms for about 3 s) shows: rolled → unroll one by one →
     back/forward/back swing → still.
   - The sleep check stops `requestAnimationFrame`.
   - With reduced motion, the plates hang still.
   - Record an mp4/GIF with ffmpeg for the user.
8. Show the user the frames or video, tune `UNROLL_PHYSICS` with them, then commit and push.

## Verification
- Ran: `git ls-remote --heads origin` → branches `drop-down-animations`, `main`,
  `retail-storefront`, `feature/tree-page-transition`, `feature/wreath-door` (2026-11-23).
- UNVERIFIED: the entire physics design above. It is a plan only.
- Planned check: build the demo with esbuild, open it in the pre-installed Playwright Chromium,
  and capture a frame strip (for example every 50 ms for 2.5 s) to show the user each tuning round.

## Blockers
- None for building. The closing animation needs a user decision later.

## Next action
On branch `drop-down-animations`, create `package.json` (devDeps: `typescript esbuild react
react-dom @types/react @types/react-dom`), run `npm install`, then write
`components/plate-unroll/math.ts` and `engine.ts` as designed above.

## User preferences to honour (from the user's profile)
- Ask clarifying questions instead of assuming. Never fabricate. Be honest about difficulty.
- Explain technical steps in full detail, including where to click and how to open or save files.
- For design work, offer unique or creative ideas and ask before using them.
- Cite sources for factual claims, and label opinions as opinions.
- Be efficient with usage, and say up front if a more efficient route exists.

## Skills Review
- ✅ git-sync: branch created from `main` and pushed. Single worktree, tree clean apart from this handoff commit.
- ✅ brainstorming / requirements: the user's motion requirements were captured before any coding.
- ⚠️ planning: the physics design is detailed but unproven. Expect tuning iterations, and show the user frames early.
