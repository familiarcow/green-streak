# Claude Code Project Rules

## Reusable Components

When implementing features, always prefer using existing reusable components over creating new ones or using raw React Native primitives:

### Modals
- **Use `BaseModal` from `src/components/modals/BaseModal.tsx`** instead of raw `<Modal>` from react-native
- BaseModal provides:
  - Proper exit animation handling (waits for animation to complete before unmounting)
  - Consistent backdrop behavior with `closeOnBackdropPress` prop
  - Consistent styling and swipe handle
  - Proper accessibility support
- See `docs/architecture.md` Modal Architecture section for detailed guidance

### Icons
- **Use `Icon` from `src/components/common/Icon.tsx`** with the `IconName` type
- Available icon names are defined in `ICON_MAP` - check the file for valid names
- Use kebab-case for multi-word icons (e.g., `'chevron-left'` not `'chevronLeft'`)

### Buttons
- **Use `AnimatedButton` from `src/components/AnimatedButton.tsx`** for primary actions
- Provides consistent styling, loading states, and animation

### Theme System
- Always import colors, typography, and spacing from `src/theme/`
- Never use hardcoded color values - use `colors.primary`, `colors.text.secondary`, etc.

## Architecture Patterns

- Follow the layered architecture documented in `docs/architecture.md`
- Use the Service Layer (TaskService, DataService, etc.) for business logic
- Keep stores thin - delegate complex logic to services
- Use custom hooks to encapsulate reusable UI logic

## Avoid Nested Modals

Never nest `<Modal>` components. Instead:
- Use view switching within a single modal (show/hide different views)
- Use the `BaseModal` component which handles animations properly
