---
name: form-accessibility
description: Standard Operating Procedure for rapid keyboard-first navigation, auto-focus, and modal safety on forms.
---

# Form Accessibility & Keyboard-First Navigation SOP

## 1. Auto-Focus
Every data entry page and modal must focus its primary input field upon rendering:
```jsx
// React example
useEffect(() => {
  inputRef.current?.focus();
}, []);
```

## 2. Escape Navigation & Confirmation
If the user hits `Escape` or clicks "Cancel/Quit":
- If form has modifications, prompt "Discard changes?" modal (`Y` to confirm, `N` to cancel).
- If form is unmodified, back out immediately via `router.back()` or `navigate(-1)`.

## 3. Financial Field Formatting
- Format amounts with 2 decimal places (`.toFixed(2)`) on blur.
- Do not display `0` or `0.00` in blank fields. Show an empty string (`''`).
- Allow natural typing without forced character jumping.

## 4. Notifications
- Never use native browser `alert()` or `prompt()`.
- Use modern toast notifications (e.g. `sonner` or custom reactive store).
