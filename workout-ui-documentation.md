# Workout Tracker PWA - UI/UX Design Documentation

## Project Overview

**Product:** Mobile-first PWA for workout tracking with granular control  
**Target Users:** Beginner to intermediate gym users (20-35 years old)  
**Core Features:** Build, track, and share workouts with smart features

---

## User Personas

### Primary: "Alex the Consistent Tracker"
- 6 months - 2 years gym experience
- Needs quick workout logging and clear progression tracking

### Secondary: "Sam the Social Lifter"
- Beginner, learns from friends
- Needs easy-to-follow workouts and video guidance

---

## Information Architecture

### Navigation Structure
```
Home → Calendar view, quick stats, group activity
My Workout → Active workout tracking, rest timer, superset management
Build → Text/visual workout creation, templates, sharing
Directory → 5,342 exercises with search, filters, videos
Stats → Progress charts, PRs, workout history
Settings → Profile, preferences, rest timer defaults
```

### Key User Flows
1. **Quick Start:** Home → Today's Workout → Track → Complete
2. **Build Workout:** Build → Type/Select Exercises → Save → Share
3. **Browse Exercises:** Directory → Search/Filter → Add to Workout

---

## Visual Design System

### Color Palette
```css
/* Primary */
Black: #000000
White: #FFFFFF
Gray-50: #F9FAFB
Gray-100: #F3F4F6
Gray-300: #D1D5DB
Gray-900: #111827

/* Semantic */
Success: #10B981
Error: #EF4444
Push: #EF4444
Pull: #3B82F6
Legs: #10B981
```

### Typography
```css
Font: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)
Sizes: 10px, 12px, 14px, 18px, 20px, 24px
Weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
```

### Spacing & Layout
- Base unit: 4px
- Border radius: 8px (small), 16px (medium), 24px (large)
- Shadows: Subtle elevation for cards and buttons
- Grid: 12-column with 16px gutters

### Motion Principles
- Duration: 200ms (fast), 300ms (normal), 500ms (slow)
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Scale animations on press: 0.95
- Hover states on all interactive elements

---

## Component Library

### 1. Exercise Card
- **Layout:** Video thumbnail left, exercise info right
- **Elements:** Progress dots with connecting lines, last workout reference, current set controls
- **States:** Active, completed, upcoming
- **Variants:** Standard, superset (connected cards)

### 2. Calendar Component
- **View:** Monthly grid with workout type indicators
- **Indicators:** PU (Push), PL (Pull), L (Legs), R (Rest)
- **States:** Today (highlighted), completed (checkmark), planned

### 3. Rest Timer
- **Display:** Large countdown, pause/resume on tap
- **Style:** Dark background for contrast, centered layout
- **Features:** Auto-start after set, audio/vibration alerts

### 4. Navigation Bar
- **Layout:** 6 icons with labels
- **Items:** Home, My Workout, Build, Directory, Stats, Settings
- **Style:** Active state with darker icon, 10px text labels

### 5. Workout Builder
- **Modes:** Text input, visual builder, templates
- **Text Format:** "5x5 Bench ss 3x10 pushups"
- **Preview:** Real-time parsing with formatted output

### 6. Progress Indicators
- **Style:** Circular dots, filled when complete
- **Active:** Scaled up slightly with border
- **Connected:** Lines between dots for sets

---

## Screen Designs

### Home Screen
- Calendar widget with color-coded workouts
- Today's workout preview card
- Quick stats (weight, completion %, streak)
- Group activity feed with PR badges

### My Workout Screen
- Card-based exercise layout
- Inline weight controls (+/- buttons)
- Prominent rest timer
- Superset indicator between exercises
- Bottom action buttons (fail/complete)

### Build Screen
- Share section at top with social buttons
- Tab selector (Text/Visual/Templates)
- Workout type dropdown with color selector
- Live preview of parsed workout
- Save template and start workout buttons

### Directory Screen
- Search bar with filter chips
- Card list with video thumbnails
- Exercise tags (muscle group, equipment)
- Quick add buttons

---

## Design Principles

### Visual Hierarchy
1. **Primary:** Exercise name, current set info, action buttons
2. **Secondary:** Progress indicators, last workout data
3. **Tertiary:** Tags, metadata, timestamps

### Interaction Patterns
- **Tap targets:** Minimum 48x48px
- **Swipe:** Between exercises (future)
- **Long press:** Quick actions (future)
- **Pull to refresh:** Sync data

### Accessibility
- High contrast text (WCAG AA)
- Clear focus states
- Semantic HTML structure
- Alt text for all images
- Screen reader optimized

---

## Responsive Behavior

### Breakpoints
- Mobile: 320px - 768px (primary)
- Tablet: 768px - 1024px
- Desktop: 1024px+ (scaled mobile view)

### Adaptations
- Bottom nav stays fixed
- Cards stack vertically
- Modals become full-screen on mobile
- Text scales appropriately

---

## Component States

### Buttons
- Default: Solid background
- Hover: Slight brightness increase
- Active: Scale 0.95
- Disabled: 50% opacity

### Cards
- Default: White background, subtle shadow
- Hover: Increased shadow
- Active: Slight scale
- Selected: Border highlight

### Input Fields
- Default: Gray border
- Focus: Black border, shadow
- Error: Red border
- Success: Green checkmark

---

## Design Tokens Summary

```javascript
// Example implementation
const theme = {
  colors: {
    primary: '#000000',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    error: '#EF4444',
    success: '#10B981'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24
  },
  animation: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};
```

---

## Handoff Checklist

- [x] Color system defined
- [x] Typography scale established
- [x] Component library documented
- [x] Interaction patterns specified
- [x] Screen designs completed
- [x] States and variants defined
- [x] Responsive behavior outlined
- [x] Accessibility requirements noted

This documentation provides all necessary UI/UX specifications for development implementation.