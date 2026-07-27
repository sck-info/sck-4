# UI Design & Component Standards

This guide covers our frontend UI standards, component design library, color palettes, animations, and form guidelines.

## Design System Tokens

Our application uses a custom luxury/wellness theme palette designed to wow users. Stick to these hex value constants when designing components or editing style attributes:

### Color Palette Reference

| Token | Color Value | Tailwind Hex Utility | UI Application |
|---|---|---|---|
| **Deep Blue-Violet** | `#1c1f4a` | `bg-[#1c1f4a]` / `text-[#1c1f4a]` | Primary text headings, sidebar background, principal buttons. |
| **Ochre Gold** | `#b86a16` | `bg-[#b86a16]` / `text-[#b86a16]` | Accent badges, hover status, call to actions, spinner indicators. |
| **Warm Light Sand** | `#faf7f2` | `bg-[#faf7f2]` | Main application body background. |
| **Warm Sand Border** | `#e8dcc4` | `border-[#e8dcc4]` | Subtle card dividers, table borders, input outlines. |
| **Sage Green** | `#6b8f71` | `bg-[#6b8f71]` | Success toast icons, active items, enabled switches. |
| **Terracotta Rust** | `#c4796a` | `bg-[#c4796a]` | Error alerts, delete buttons, warning descriptions. |
| **Slate Gray** | `#5a5e7a` | `text-[#5a5e7a]` | Secondary text, support labels, sub-descriptions. |

---

## Typography

We define distinct font families to establish a clear hierarchy:
1.  **Display Font**: Used for top-level headers (h1, h2, h3). Employs elegant serif weights like Outfit or Playfair Display. (e.g., class `font-display`).
2.  **Body Font**: Used for table labels, description texts, lists, inputs, and paragraphs. Employs clean sans-serif families like Inter or System-UI. (e.g., class `font-sans`).

---

## Layout Component Hierarchy

All pages on the dashboard must adhere to the standard header structure:
*   **Header Section**: Includes an explicit page heading (`h1`), description text (`p`), and main CTA button (e.g., "Create Contact").
*   **Loading State**: Display a full-height centered layout with a spinning gold loader (`Loader2` from `lucide-react`) and helper description.
*   **Error State**: Render inline or absolute warning block using terracotta colors.
*   **Empty State**: Display a dashed warm sand border card alerting the user that no records exist, containing a center-aligned action button.

---

## Form Modals and Validation Standards

Forms are presented inside Radix dialog overlays (`Dialog` component). When implementing forms, observe these guidelines:

### State Management
*   Provide clear inline errors rather than breaking the form layout.
*   Validate fields immediately on input submit. For URLs (e.g., social links), use the helper validation:
    ```typescript
    const isValidUrl = (url: string) => {
      if (!url) return true;
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    };
    ```

### Interactive Feedback & Loading State
*   Disable form elements and action buttons during form submission.
*   Provide a spinner icon (e.g., `Loader2` with `animate-spin`) within the action button.
*   On successfully saving, display success toasts via `sonner` (`toast.success(...)`).

```typescript
// Button example during submit
<Button type="submit" disabled={loading}>
  {loading ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : (
    "Save Details"
  )}
</Button>
```

---

## Motion & Transition Rules

We use **Framer Motion** for animations:
*   Use `<AnimatePresence>` for items that dynamically mount/unmount from the DOM (e.g., alert dialog panels, notification banners).
*   For transitions, use spring ease values for dialog fade-ins and slide entries:
    ```typescript
    transition={{ type: "spring", damping: 25, stiffness: 350 }}
    ```
*   Keep page fade-ins subtle. Avoid large offsets (prefer `opacity: 0` to `opacity: 1` over short durations of `0.2s`).
