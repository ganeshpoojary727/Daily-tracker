# Foldable Navigation Sidebar & Right-Side Java Compiler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a foldable navigation sidebar (expanding/collapsing to a slim icon rail) and a right-side split-screen Java code editor & compiler powered by the Piston API to allow live hands-on coding beside course videos.

**Architecture:** 
- The sidebar component gains an `isCollapsed` state with persistent storage (`localStorage`), collapsing from `w-60` to `w-16` with hover tooltips.
- An in-app Java compilation service (`src/lib/pistonApi.ts`) interfaces with the public Piston sandbox API.
- A split-screen right drawer (`JavaPlaygroundPanel.tsx`) provides a dark IDE code editor, boilerplate/starter templates, stdin input, and an interactive terminal console.

**Architecture Diagram:**

```mermaid
graph LR
    subgraph "Layout Architecture"
        Header[Header with Sidebar & Playground Toggles]
        Sidebar[Sidebar (Expanded w-60 / Collapsed w-16)]
        MainView[Main View: Video Course Hub / Checklist]
        JavaPanel[Java Playground Right Panel w-96 to 420px]
    end

    subgraph "Execution Pipeline"
        Editor[Monospace Code Editor + Stdin] --> PistonService[src/lib/pistonApi.ts]
        PistonService --> PistonAPI[Piston REST API (emkc.org)]
        PistonAPI --> ConsoleOutput[Terminal Console: stdout / stderr / timer]
    end

    Header --> Sidebar
    Header --> JavaPanel
    MainView --- JavaPanel
```

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React, Piston Code Execution API

**Spec:** [docs/superpowers/specs/2026-10-03-foldable-nav-and-java-compiler-design.md](file:///c:/Users/ganes/OneDrive/Desktop/Daily-tracker/docs/superpowers/specs/2026-10-03-foldable-nav-and-java-compiler-design.md)

## Global Constraints
- Target platform: Daily Tracker web app (React 18 + Vite + Tailwind CSS).
- Persistent state keys: `dt_sidebar_collapsed` (boolean), `dt_java_scratchpad_code` (string), `dt_java_panel_open` (boolean).
- Java execution engine: Piston API `https://emkc.org/api/v2/piston/execute`, OpenJDK runtime.
- Do NOT push to remote GitHub until explicitly requested by the user.

---

### Task 1: Foldable Navigation Sidebar Component & State

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Layout.tsx`

**Interfaces:**
- Consumes: `isCollapsed: boolean`, `onToggleCollapse: () => void` in `SidebarProps`
- Produces: Persistent collapsed state (`w-16` icon-rail) with floating hover tooltips for all navigation items

- [ ] **Step 1: Update SidebarProps and implement icon-only rail layout in Sidebar.tsx**
  - Add `isCollapsed?: boolean` and `onToggleCollapse?: () => void` to `SidebarProps`.
  - When `isCollapsed` is true, render the sidebar at `w-16` instead of `w-60`.
  - Hide text labels, center the icons, and add title tooltips to buttons (`title={item.label}`).
  - Add a collapse toggle button at the bottom of the sidebar.

- [ ] **Step 2: Add sidebar collapse toggle button to Header.tsx**
  - Add a `<PanelLeftClose />` / `<PanelLeft />` button next to the app logo on desktop.
  - Wire it to toggle the sidebar.

- [ ] **Step 3: Manage `isSidebarCollapsed` in Layout.tsx with persistent storage**
  - Read initial state from `localStorage.getItem('dt_sidebar_collapsed') === 'true'`.
  - Save to `localStorage` on toggle.
  - Ensure main container smoothly resizes when sidebar collapses/expands.

- [ ] **Step 4: Verify build and test sidebar collapse**
  - Run: `npm run build`
  - Expected: Exit code 0.

- [ ] **Step 5: Commit Task 1 locally**
  - `git add src/components/layout/Sidebar.tsx src/components/layout/Header.tsx src/components/layout/Layout.tsx`
  - `git commit -m "feat(nav): add foldable navigation sidebar with icon-only compact rail"`

---

### Task 2: Piston API Client Service

**Files:**
- Create: `src/lib/pistonApi.ts`

**Interfaces:**
- Produces: `executeJavaCode(code: string, stdin?: string): Promise<JavaExecutionResult>`
- Type: `JavaExecutionResult { success: boolean; stdout: string; stderr: string; executionTimeMs?: number; exitCode: number; error?: string }`

- [ ] **Step 1: Create `src/lib/pistonApi.ts`**
  - Implement `executeJavaCode` calling `https://emkc.org/api/v2/piston/execute`.
  - Set language to `java`, file name `Main.java`.
  - Parse `run.stdout`, `run.stderr`, `run.code`, and compile stage errors if `compile.stderr` is present.
  - Add fallback error handling for offline/network issues.

- [ ] **Step 2: Verify type correctness**
  - Run: `npm run build`
  - Expected: Exit code 0.

- [ ] **Step 3: Commit Task 2 locally**
  - `git add src/lib/pistonApi.ts`
  - `git commit -m "feat(compiler): add Piston API client service for Java execution"`

---

### Task 3: Starter Java Code Templates & Presets

**Files:**
- Create: `src/data/javaTemplates.ts`

**Interfaces:**
- Produces: `JAVA_TEMPLATES: { id: string; name: string; category: string; code: string; defaultStdin?: string }[]`

- [ ] **Step 1: Create `src/data/javaTemplates.ts`**
  - Add templates matching course topics:
    - *Hello World & Variables*
    - *Classes & Methods (OOP)*
    - *Arrays & For-Each Loop*
    - *Multithreading (Runnable & start)*
    - *Collections & HashMap*
    - *Stream API Pipeline (map/filter)*
    - *Scanner User Input*

- [ ] **Step 2: Verify type check**
  - Run: `npm run build`
  - Expected: Exit code 0.

- [ ] **Step 3: Commit Task 3 locally**
  - `git add src/data/javaTemplates.ts`
  - `git commit -m "feat(compiler): add Java course starter templates and code presets"`

---

### Task 4: Java Playground & Compiler Panel Component

**Files:**
- Create: `src/components/compiler/JavaPlaygroundPanel.tsx`

**Interfaces:**
- Consumes: `isOpen: boolean`, `onClose: () => void`
- Produces: Interactive split-screen code editor with line numbers, template selector, stdin drawer, Run button, and terminal output

- [ ] **Step 1: Implement `JavaPlaygroundPanel.tsx`**
  - Dark IDE aesthetic with tab support, line numbers counter, and auto-indent.
  - Template dropdown to load preset examples with one click.
  - Collapsible Stdin input drawer.
  - "Run Code" button with loading spinner and shortcut `Ctrl+Enter`.
  - Terminal-style output box with colored stdout/stderr, runtime elapsed badge, and Clear button.
  - Code persistence to `localStorage` (`dt_java_scratchpad_code`).

- [ ] **Step 2: Verify build**
  - Run: `npm run build`
  - Expected: Exit code 0.

- [ ] **Step 3: Commit Task 4 locally**
  - `git add src/components/compiler/JavaPlaygroundPanel.tsx`
  - `git commit -m "feat(compiler): create interactive Java Playground and Compiler panel"`

---

### Task 5: Layout Split-Screen Integration & Global Keyboard Shortcuts

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Layout.tsx`

**Interfaces:**
- Wires: Java Playground trigger in Header and global keyboard listeners (`Ctrl + \`, `Ctrl + Enter`).
- Produces: Smooth split-screen layout where the main viewport and Java panel share the screen cleanly.

- [ ] **Step 1: Add "Java Compiler" action button to Header.tsx**
  - Button with `<Code2 />` or `<Terminal />` icon, showing active status badge.
  - Keyboard hint badge: `Ctrl + \`.

- [ ] **Step 2: Embed `JavaPlaygroundPanel` in Layout.tsx**
  - Render as a right split pane on desktop (`w-[440px]`) and slide-in drawer on mobile/tablet.
  - Store open state in `localStorage` (`dt_java_panel_open`).
  - Add global key listener for `Ctrl + \` to toggle panel from anywhere in the app.

- [ ] **Step 3: Verify build and end-to-end functionality**
  - Run: `npm run build`
  - Expected: Exit code 0.

- [ ] **Step 4: Commit Task 5 locally**
  - `git add src/components/layout/Header.tsx src/components/layout/Layout.tsx`
  - `git commit -m "feat(compiler): integrate Java Playground split panel and global shortcuts"`

---

### Task 6: Final Verification & Polish

- [ ] **Step 1: Comprehensive Testing**
  - Test Sidebar folding/unfolding and tooltips.
  - Test Java Playground code editing, template loading, and running with Piston API.
  - Test Scanner with stdin input.
  - Verify zero console warnings or layout overflows.
- [ ] **Step 2: Build verification**
  - Run: `npm run build`
  - Confirm clean exit code 0.
