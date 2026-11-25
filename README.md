<div align="center">

  <!-- Animated Typing Header -->
  <a href="https://kestrel-terminal.vercel.app">
    <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=34&duration=3000&pause=1000&color=38BDF8&center=true&vCenter=true&width=700&height=70&lines=KESTREL+TERMINAL;Next-Gen+Command+Center;Fast.+Modular.+Built+for+Precision." alt="Kestrel Terminal Typing Animation" />
  </a>

  <p align="center">
    <strong>A high-velocity, modern web terminal & workspace interface built with TypeScript, TanStack Start, and Supabase.</strong>
  </p>

  <!-- Live Status & Tech Stack Badges -->
  <p align="center">
    <a href="https://kestrel-terminal.vercel.app">
      <img src="https://img.shields.io/badge/LIVE_DEMO-kestrel--terminal.vercel.app-0EA5E9?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
    </a>
    <img src="https://img.shields.io/badge/TypeScript-94.6%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-Bundled-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Bun-Ready-FBF0DF?style=for-the-badge&logo=bun&logoColor=black" alt="Bun" />
  </p>

  <!-- Animated Divider Line -->
  <img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%" />

</div>

<br />

<!-- Terminal Preview Simulation -->
<div align="center">
  <table>
    <tr>
      <td align="left">
        <pre lang="bash">
┌──(kestrel@terminal)-[~/workspace]
└─$ kestrel init --fast --sync

  ⚡ Booting Kestrel Terminal v1.0...
  ✔ TanStack Router & SSR engine initialized
  ✔ Supabase real-time client connected
  ✔ UI primitives & design tokens mounted

  🚀 Ready at https://kestrel-terminal.vercel.app
        </pre>
      </td>
    </tr>
  </table>
</div>

## ✦ Overview

**Kestrel Terminal** is a sleek, keyboard-first web application engineered for speed, clarity, and seamless execution. Designed with a sharp terminal-inspired aesthetic and backed by a type-safe full-stack architecture, it bridges low-latency client interactions with persistent cloud state.

> 🌐 **Live Deployment:** [kestrel-terminal.vercel.app](https://kestrel-terminal.vercel.app)

---

## ⚡ Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Core Language** | `TypeScript` (94.6%) | End-to-end type safety across client, routes, and database schemas |
| **Framework & Routing** | `TanStack Start` + `Vite` | Type-safe routing, fast HMR, and optimized production builds |
| **Backend & Auth** | `Supabase` | Real-time database, authentication, and edge persistence |
| **UI & Styling** | `Tailwind CSS` + `shadcn/ui` | Composable, accessible component primitives (`components.json`) |
| **Runtime & Testing** | `Bun` / `Node.js` + `Vitest` | Ultra-fast package resolution and unit/integration testing |

---

## 🗂️ Repository Structure

```text
kestrel-terminal/
├── public/              # Static assets, icons, and manifest files
├── src/                 # Application source code, routes, hooks & UI components
├── supabase/            # Database migrations, edge functions & backend config
├── AGENTS.md            # AI agent conventions & architectural guidelines
├── roadmap.md           # Feature milestones and upcoming releases
├── components.json      # UI component registry configuration
├── vite.config.ts       # Vite build & plugin pipeline
└── vitest.config.ts     # Automated test runner configuration
