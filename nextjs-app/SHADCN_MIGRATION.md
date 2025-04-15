# Zephyr Warehouse Management - Shadcn UI Migration

This document outlines the approach and progress of migrating the Zephyr Warehouse Management System to use Shadcn UI components and design patterns.

## What is Shadcn UI?

Shadcn UI is a collection of reusable components built with Radix UI primitives and styled with Tailwind CSS. It provides a robust foundation for building accessible, customizable, and consistent user interfaces.

Key benefits:
- Accessibility built-in
- Component-driven development
- Customizable design tokens
- Dark mode support
- TypeScript-first development

## Integration Approach

We've chosen an incremental migration approach to minimize disruption while enhancing the user experience:

1. **Foundation Setup**
   - ✅ Install necessary dependencies
   - ✅ Configure component styling system
   - ✅ Set up theming and dark mode support
   - ✅ Update project structure for shadcn patterns

2. **Component Migration (In Progress)**
   - ⏳ Create base UI components (button, card, etc.)
   - ⏳ Migrate layout components
   - ⏳ Update dashboard components
   - ⏳ Refactor authentication screens

3. **Feature Enhancement (Planned)**
   - 🔄 Add command palette
   - 🔄 Implement enhanced data tables
   - 🔄 Add toast notifications
   - 🔄 Enhance charts and visualizations

## Usage Instructions

### Adding a new Shadcn component

1. Install required dependencies
2. Create the component in `/components/ui/`
3. Follow the Shadcn pattern with variants and styles
4. Use the `cn()` utility for class merging

### Using components in your application

```tsx
import { Button } from "@/components/ui/button";

export default function MyComponent() {
  return (
    <Button variant="default" size="lg">
      Click Me
    </Button>
  );
}
```

## Theme Customization

The theme uses CSS variables and is configured in `globals.css`. The system supports both light and dark modes through the `ThemeProvider` component.

To toggle between themes:

```tsx
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle Theme
    </button>
  );
}
```

## Relevant Files

- `tailwind.config.js` - Tailwind configuration
- `components.json` - Shadcn component configuration
- `styles/globals.css` - Theme variables
- `lib/utils.ts` - Utility functions
- `components/ui/` - UI components

## Reference

- [Shadcn UI Documentation](https://ui.shadcn.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS](https://tailwindcss.com/docs)
