# Story Patterns

CSF story format, realistic state coverage, `play` functions, and mock service layer.

## Component Story Format (CSF) basics

```ts
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/preact";
import { Button } from "./Button";

// Meta applies to all stories in the file
const meta: Meta<typeof Button> = {
  component: Button,
  title: "Components/Button",
  tags: ["autodocs"],         // generates a Docs page for this component
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "danger"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

// Each named export is a story
export const Primary: Story = {
  args: { children: "Continue", variant: "primary" },
};

export const Loading: Story = {
  args: { children: "Saving…", variant: "primary", isLoading: true, disabled: true },
};

export const Disabled: Story = {
  args: { children: "Not available", variant: "secondary", disabled: true },
};

export const Destructive: Story = {
  args: { children: "Delete account", variant: "danger" },
};

export const LongLabel: Story = {
  args: { children: "This is an unusually long button label for overflow testing" },
};
```

## State coverage checklist

For every interactive component, include:

- [ ] Default (resting state)
- [ ] Hover / focus (use `play` to simulate or add `parameters.pseudo`)
- [ ] Active / pressed
- [ ] Loading / pending
- [ ] Disabled
- [ ] Error state
- [ ] Empty / no data
- [ ] Long content (truncation, overflow)

## `play` functions for interaction testing

```ts
// src/components/LoginForm/LoginForm.stories.tsx
import { userEvent, within, expect } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/preact";
import { LoginForm } from "./LoginForm";

const meta: Meta<typeof LoginForm> = {
  component: LoginForm,
  title: "Forms/LoginForm",
};
export default meta;
type Story = StoryObj<typeof LoginForm>;

export const SubmitWithInvalidEmail: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Email"), "not-an-email");
    await userEvent.type(canvas.getByLabelText("Password"), "hunter2");
    await userEvent.click(canvas.getByRole("button", { name: /sign in/i }));

    // Assert the validation error appears
    await expect(canvas.getByRole("alert")).toBeInTheDocument();
    await expect(canvas.getByRole("alert")).toHaveTextContent(/valid email/i);
  },
};

export const SubmitWithValidCredentials: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Email"), "user@example.com");
    await userEvent.type(canvas.getByLabelText("Password"), "correctpassword");
    await userEvent.click(canvas.getByRole("button", { name: /sign in/i }));

    // Button should enter loading state
    await expect(canvas.getByRole("button", { name: /sign in/i })).toBeDisabled();
  },
};
```

## Mocking service / API calls

```ts
// Use MSW (Mock Service Worker) or handler mocks in the story decorator
import { http, HttpResponse } from "msw";
import type { Meta, StoryObj } from "@storybook/preact";
import { ProductList } from "./ProductList";

const meta: Meta<typeof ProductList> = {
  component: ProductList,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/products", () =>
          HttpResponse.json({
            data: [
              { id: "1", name: "Widget", price: 999 },
              { id: "2", name: "Gadget", price: 4999 },
            ],
          })
        ),
      ],
    },
  },
};
export default meta;
type Story = StoryObj<typeof ProductList>;

export const Default: Story = {};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/products", () => HttpResponse.json({ data: [] })),
      ],
    },
  },
};

export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/products", () => new HttpResponse(null, { status: 500 })),
      ],
    },
  },
};
```

## Rules

- Keep one story per meaningful state — not one story per prop combination.
- Always include loading, empty, error, and long-content states.
- Use `play` functions for any story that tests user interaction or form validation.
- Mock at the network layer with MSW rather than passing mock props that bypass real data-fetching logic.
- Keep stories deterministic: no random data, no real timers, no live network calls.
- Use realistic data, not placeholders like "Lorem ipsum" or `"test"`.
