# General guidelines

- Always open `specs.md` before working.
- If the task you are working on is too big, create a build plan.
  - Create milestones for file modifications.
  - Confirm before continuing to the next step on your plan.
- Before work in new html/css blocks, verify if there aren't components wich satisfies your necessities.
- Before adding logic to a component/page file, verify if a hook already exists. If the logic can be encapsulated into a hook, create one.
- Always use the services layer for API calls

# Code guidelines

- Always use TypeScript.
- Naming conventions:
  - Constants and environment variables should always be uppercase (ex.: API_URL).
  - Class names and types should be in PascalCase (ex.: HomePage).
  - Variable names should be in camelCase (ex.: user, data).
  - File and folder names should be in PascalCalse (ex.: AuthMenu)
  - Status values should be uppercase (ex.: PENDING, TEXT_EXTRACTION).

# Web architecture

├── AGENTS.md
├── CLAUDE.md -> AGENTS.md
├── app
│ │ └── page.tsx
│ ├── components
│ ├── globals.css
│ ├── helpers
│ ├── hooks
│ ├── layout.tsx
│ ├── page.tsx
│ └── services
├── eslint.config.cjs
├── next-env.d.ts
├── next.config.js
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
