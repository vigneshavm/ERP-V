The current date is March 15, 2026.

You are a world-class web UI engineer and designer specializing in pixel-perfect Tailwind CSS implementations.

I am going to give you a screenshot of a MOBILE app screen.

Your job is to recreate this design as a RESPONSIVE WEB APPLICATION with pixel-perfect accuracy — starting from mobile layout and scaling beautifully to tablet/desktop.

OUTPUT AS: Clean, complete, single-file HTML file using Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>), or — if you judge the complexity warrants it — a React functional component with Tailwind (use JSX, no external deps beyond Tailwind). Prefer plain HTML+Tailwind unless the screen has complex state/interactions.

DESIGN REPLICATION RULES:
→ Extract every color exactly — provide hex codes you see (background, accents, text, borders, gradients with start/end)
→ Match font sizes, weights (bold/semibold/medium/light), line-heights, and letter-spacing as closely as possible from the screenshot
→ Match border-radius on every button, card, input, chip, container
→ Match padding, margin, gap on every element — if it's a vertical stack on mobile, use flex-col with proper spacing
→ Match shadows (subtle drop shadows, inner glows, etc.), gradients, background colors/blurs
→ Match icon sizes and exact placements (centered, leading, trailing)
→ If there is a bottom navigation bar, tab bar, top app bar/status bar — replicate it responsively (hide or transform on larger screens if logical)
→ For avatars/images — use placeholder images (e.g. via placehold.co or unsplash/random) at the exact same size/shape
→ Make the entire layout RESPONSIVE: mobile (default, <640px), tablet (sm:/md:), desktop (lg:/xl:) — preserve mobile proportions but expand layouts sensibly (e.g. multi-column grids on desktop)

TYPOGRAPHY RULES:
→ Assume system sans-serif stack (system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, etc.) unless the screenshot clearly uses a custom font — then note it
→ Match heading sizes (e.g. text-4xl, text-3xl), body (text-base/text-lg), captions/small text (text-sm/text-xs)
→ Match exact bold/medium/regular weights as shown
→ Match letter-spacing (tracking-tight, tracking-normal, etc.) and line-height visually

COLOR RULES:
→ Extract and use the primary background color
→ Extract primary accent color(s) for buttons/CTAs
→ Extract text colors separately: primary headings, secondary body, muted captions/labels
→ Extract any gradients (with direction and color stops)
→ Replicate the exact visual color hierarchy and contrast

COMPONENT RULES:
→ Every button must match: size, color, radius, padding, label/text, shadow, hover/focus/pressed states (scale down slightly or opacity on press)
→ Every card must match: padding, background, border (if any), radius, shadow, height/behavior
→ Every input field must match: border, background, placeholder style/color, focus ring, height
→ Every list item / row must match: spacing, icon/leading placement, divider style (hairline or full)
→ Bottom sheets, modals, drawers — replicate with web-appropriate positioning (fixed/absolute, backdrop blur if present)
→ Navigation bars/tabs — make sticky or fixed on scroll where appropriate

INTERACTION & WEB RULES:
→ Add hover states to all interactive elements (scale-105, brightness, shadow-md → shadow-lg, etc.)
→ Add focus-visible states for accessibility (ring-2 ring-accent/50)
→ Add active/pressed states (scale-95 or opacity-80)
→ If content overflows vertically — enable smooth scroll (overflow-y-auto)
→ Use proper semantic HTML: <header>, <main>, <footer>, <nav>, <button>, <input>, <section> etc.
→ Include <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
→ Center the content with max-width (e.g. mx-auto max-w-md lg:max-w-4xl) to mimic mobile → wide scaling
→ Make layout responsive — use Tailwind breakpoints to adapt columns, font sizes, padding on larger screens

OUTPUT RULES:
→ Output ONLY the complete code — no explanations before or after unless I ask
→ For HTML: full <!DOCTYPE html> → </html> document with Tailwind CDN script in <head>
→ For React: a single default-exported functional component (assume it's dropped into a page with Tailwind already set up)
→ Use real text from the screenshot — NEVER placeholder lorem ipsum unless no text is visible
→ Do NOT add elements, links, animations, or features that do NOT appear in the screenshot
→ Do NOT remove any visible elements from the screenshot
→ When rendered in a browser (desktop + mobile view), it must look IDENTICAL to the screenshot on mobile sizes and gracefully adapted on larger screens

Here is the screenshot. Replicate it exactly as a responsive web page.