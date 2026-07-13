# UI Design System

A small set of reusable, Tailwind v4–styled React components shared across the
Hackathon Management Portal. Use these instead of hand-rolling inline Tailwind so
the Admin and Participant modules stay visually consistent.

All components live in `src/components/ui/` and are default exports.

---

## Button

A styled button supporting visual variants, two sizes, and a built-in loading
state. While `isLoading` is `true`, the button shows a spinner and is disabled.

**Props**

| Prop        | Type                                      | Default     | Description                                  |
| ----------- | ----------------------------------------- | ----------- | -------------------------------------------- |
| `variant`   | `'primary' \| 'danger' \| 'secondary'`    | `'primary'` | Visual style. `danger` is an outlined red.   |
| `size`      | `'sm' \| 'md'`                            | `'md'`      | Use `sm` for compact actions (e.g. in rows). |
| `isLoading` | `boolean`                                 | `false`     | Shows a spinner and disables the button.     |
| `type`      | `'button' \| 'submit' \| 'reset'`         | `'button'`  | Native button type.                          |
| `children`  | `ReactNode`                               | —           | Button label.                                |
| `...rest`   | standard button attrs (`onClick`, `disabled`, …) | —    | Forwarded to the underlying `<button>`.      |

```jsx
import Button from '../components/ui/Button'

// Primary action
<Button variant="primary" onClick={handleSubmit}>
  Join Hackathon
</Button>

// Submit button with loading state (spinner + disabled while saving)
<Button type="submit" variant="primary" isLoading={saving}>
  Save
</Button>

// Compact, destructive action inside a table row
<Button variant="danger" size="sm" isLoading={isDeleting} onClick={() => remove(id)}>
  Delete
</Button>

// Cancel / secondary action
<Button variant="secondary" onClick={() => navigate(-1)}>
  Cancel
</Button>
```

---

## Input

A labeled form field that renders either an `<input>` or a `<textarea>`. Provides
standardized borders, focus rings, and spacing. Pass `type="textarea"` to switch
to a multi-line field; any other value is used as the native input `type`.

**Props**

| Prop          | Type                                          | Default  | Description                                       |
| ------------- | --------------------------------------------- | -------- | ------------------------------------------------- |
| `label`       | `string`                                      | —        | Optional label rendered above the field.          |
| `type`        | `'text' \| 'date' \| 'textarea' \| string`    | `'text'` | `'textarea'` renders a textarea; else an input.   |
| `value`       | `string`                                      | —        | Controlled value.                                 |
| `onChange`    | `(event) => void`                             | —        | Change handler.                                   |
| `name`        | `string`                                      | —        | Field name (also used as `id` if `id` is omitted).|
| `required`    | `boolean`                                     | `false`  | Marks the field required and shows a `*`.         |
| `placeholder` | `string`                                      | —        | Placeholder text.                                 |
| `rows`        | `number`                                      | `4`      | Row count for `textarea`.                         |
| `className`   | `string`                                      | `''`     | Applied to the wrapper (e.g. spacing utilities).  |
| `...rest`     | standard field attrs                          | —        | Forwarded to the input/textarea.                  |

```jsx
import Input from '../components/ui/Input'

// Text field
<Input
  label="Team Name"
  name="teamName"
  value={form.teamName}
  onChange={handleChange}
  placeholder="e.g. The Debuggers"
  required
/>

// Date field
<Input
  label="Submission Deadline"
  type="date"
  name="deadline"
  value={form.deadline}
  onChange={handleChange}
/>

// Multi-line textarea (wrapper spacing via className)
<Input
  className="mb-5"
  label="Project Description"
  type="textarea"
  name="description"
  value={form.description}
  onChange={handleChange}
/>
```

---

## StatCard

A compact card for surfacing a single metric on dashboards. Accepts a `title`
and `value`, with an optional `accent` color for the value text.

**Props**

| Prop     | Type               | Default            | Description                                  |
| -------- | ------------------ | ------------------ | -------------------------------------------- |
| `title`  | `string`           | —                  | Metric label.                                |
| `value`  | `string \| number` | —                  | Metric value (displayed large).              |
| `accent` | `string`           | `'text-slate-900'` | Tailwind text-color class for the value.     |

```jsx
import StatCard from '../components/ui/StatCard'

<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
  <StatCard title="My Submissions" value={4} accent="text-blue-600" />
  <StatCard title="Teams Joined" value={2} accent="text-emerald-600" />
  <StatCard title="Pending Reviews" value={1} accent="text-amber-600" />
</div>
```
