
# Play it Forward Basketball — Phase 1 Plan

## 1. Design System & Layout Foundation
- Set up custom color tokens (navy, red, blue) and fonts (Barlow Condensed, Barlow, Bebas Neue) in CSS variables and Tailwind config
- Build the shared app layout: fixed 240px sidebar with nav links (Dashboard, Courses, Coaches, Community, My Progress, Upgrade, Sign Out) + 64px sticky topbar
- Mobile responsive sidebar (hamburger menu / drawer)

## 2. Authentication — `/login`
- Split-screen auth page: left brand panel with dark gradient, "PIF" watermark, coach avatars, stats strip; right panel with Sign In / Create Account tabs
- Sign In: email + password fields, show/hide toggle, forgot password, Google sign-in button
- Create Account: name fields, email, password with live strength meter, position dropdown
- Connect to Supabase auth (signUp, signInWithPassword, signInWithOAuth for Google)
- Email confirmation screen post-signup
- Auth guard: redirect logged-in users to `/dashboard`, protect app routes

## 3. Supabase Database Setup
- Create tables: `profiles`, `coaches`, `courses`, `drills`, `user_course_progress`, `user_drill_progress`, `saved_drills`
- Enable RLS with appropriate policies (users read/write own data, coaches/drills public read)
- Database trigger to auto-create profile on signup
- Seed coaches data (Zac Ervin, Alex Wade, Torrence Watson, Hunter McIntosh, Julian Roper, Jay Blue)
- Seed sample courses and drills with Vimeo IDs

## 4. Dashboard — `/dashboard`
- Time-based greeting with user's first name
- 4 animated stat cards (streak, drills done, hours trained, weekly rank)
- "Continue Where You Left Off" card with course progress
- Featured Drills grid (3 columns) with category-colored cards, coach info, lock overlay for pro drills
- Desktop leaderboard sidebar with top 7 users + coach spotlight

## 5. Courses Library — `/courses`
- Course card grid with thumbnails, coach info, progress bars, drill count, level badges
- Filter/search functionality
- Category color coding (Ball Handling red, Shooting blue, Athletics green, IQ gold, Mental purple)

## 6. Course Player — `/courses/[id]/[drillIndex]`
- Left panel: course progress rail (320px) with drill list showing completed ✅, current ▶, locked 🔒 states
- Right panel: Vimeo video embed (16:9), drill info bar, three tabs (Overview, Coaching Tips, Discussion)
- "Mark Complete & Continue →" interaction: loading → green success → auto-advance to next drill
- Course completion modal with trophy animation on final drill
- Mobile: left panel becomes bottom drawer

## 7. Pricing Page — `/pricing`
- Monthly/annual billing toggle
- Free vs Pro plan comparison cards
- Pro card with red border, "Most Popular" pill, trial pricing ($7 for 7 days → $27/mo)
- Social proof strip with avatar stack
