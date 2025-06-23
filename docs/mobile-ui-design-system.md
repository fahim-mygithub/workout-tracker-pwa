# Mobile-First UI Design System for Workout App

## Design Principles

### 1. Touch-First Interactions
- Minimum touch target size: 44x44px (iOS) / 48x48dp (Android)
- Comfortable spacing between interactive elements
- Gesture support (swipe, long-press, pinch-to-zoom)
- Visual feedback for all touch interactions

### 2. Thumb-Friendly Navigation
- Primary actions within thumb reach zone
- Bottom navigation for main sections
- FAB (Floating Action Button) for primary workout actions
- Swipe gestures for navigation between screens

### 3. Progressive Disclosure
- Show essential information first
- Use sheets/drawers for additional options
- Collapsible sections for detailed info
- Context-aware UI elements

### 4. Performance & Responsiveness
- Optimistic UI updates
- Skeleton loading states
- Smooth animations (60fps)
- Minimal layout shifts

## Component Architecture

### Navigation Components

#### 1. **Bottom Navigation Bar** (Mobile Primary)
- Fixed at bottom with safe area padding
- 5 main sections: Home, Workout, Build, Exercises, Profile
- Active state with accent color
- Icon + label for clarity
- Height: 72px + safe area

#### 2. **Top App Bar** (Contextual)
- Minimal height: 56px
- Contains: Back button, Title, Actions (max 2)
- Transforms/hides on scroll for more content space
- Transparent overlay on workout screens

### Core Components

#### 1. **Exercise Card** (Mobile Optimized)
- **Collapsed State**: 
  - Exercise name
  - Target muscles badge
  - Last performance indicator
  - Expand chevron
- **Expanded State**:
  - Set tracking with large input areas
  - Swipe actions (complete/skip)
  - Rest timer integration
  - Notes section

#### 2. **Bottom Sheet** (Primary Modal Pattern)
- Replaces traditional modals
- Drag handle for intuitive dismissal
- Multiple snap points (25%, 50%, 90%)
- Used for:
  - Exercise details
  - Rest timer
  - Workout completion
  - Filters

#### 3. **Action Buttons**
- **Primary Action**: Full-width bottom button (56px height)
- **Secondary Actions**: Icon buttons (48x48px)
- **FAB**: For starting/pausing workout (56x56px)

#### 4. **Input Components**
- **Number Input**: Large touch targets with +/- buttons
- **Text Input**: Full-width with 48px minimum height
- **Select/Dropdown**: Bottom sheet picker pattern
- **Toggle/Switch**: 48px touch target

#### 5. **Cards & Lists**
- **Exercise List Item**: 72px height with touch states
- **Workout Card**: Expandable with progress indicator
- **Stats Card**: Compact with primary metric focus

### Layout Patterns

#### 1. **Home Screen**
- Hero card with current workout progress
- Quick action buttons
- Recent activity list
- Bottom sheet for detailed stats

#### 2. **Workout Screen**
- Full-screen focus mode
- Swipeable exercise cards
- Floating rest timer
- Progress indicator at top

#### 3. **Build Screen**
- Search bar fixed at top
- Exercise picker in scrollable list
- Selected exercises in bottom sheet
- Drag-to-reorder functionality

#### 4. **Exercise Directory**
- Search with filters in collapsible header
- Grid view (2 columns) on mobile
- Lazy loading with skeleton states
- Quick add button on each card

### Interaction Patterns

#### 1. **Gestures**
- Swipe right: Complete/Mark done
- Swipe left: Skip/Delete
- Long press: Quick actions menu
- Pull to refresh: Update data
- Pinch: Zoom exercise images

#### 2. **Transitions**
- Shared element transitions between screens
- Bottom sheet slide-up animations
- Fade and scale for modals
- Smooth scrolling with momentum

#### 3. **Feedback**
- Haptic feedback for actions
- Visual ripple effects
- Loading skeletons
- Success/error toasts at top

### Responsive Breakpoints

```css
/* Mobile First */
/* Default: 320px - 639px */

/* Tablet Portrait */
@media (min-width: 640px) { }

/* Tablet Landscape */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }
```

### Color & Theme Application

#### Light Mode
- Background: Pure white for cards
- Primary actions: Deep black
- Secondary: Light gray backgrounds
- Accents: High contrast for CTAs

#### Dark Mode
- Background: Deep black
- Cards: Slightly elevated gray
- Primary actions: Off-white
- Accents: Vibrant but accessible

### Typography Scale (Mobile)

```css
/* Mobile Typography */
.text-xs: 12px / 16px
.text-sm: 14px / 20px
.text-base: 16px / 24px
.text-lg: 18px / 28px
.text-xl: 20px / 28px
.text-2xl: 24px / 32px
.text-3xl: 30px / 36px
```

### Spacing System

```css
/* Mobile Spacing */
--space-xs: 8px
--space-sm: 12px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
--space-2xl: 48px
```

### Implementation Priority

1. **Phase 1**: Navigation & Core Layout
   - Bottom navigation implementation
   - Mobile-first layout components
   - Theme integration

2. **Phase 2**: Core Components
   - Exercise cards redesign
   - Bottom sheets for modals
   - Touch-optimized inputs

3. **Phase 3**: Workout Experience
   - Workout screen optimization
   - Rest timer enhancement
   - Gesture interactions

4. **Phase 4**: Polish & Performance
   - Animations & transitions
   - Loading states
   - Performance optimization