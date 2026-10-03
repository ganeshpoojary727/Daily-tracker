# Design Specification: Foldable Navigation Sidebar & Right-Side Java Compiler Panel

**Date:** 2026-10-03  
**Status:** Approved for Implementation  
**Target Platform:** Daily Tracker Web App (React 18 + TypeScript + Tailwind CSS + Lucide Icons)

---

## 1. Executive Summary

This specification defines two synergistic workspace enhancements designed to maximize screen real estate and enable active hands-on coding while following video courses:
1. **Foldable / Collapsible Navigation Sidebar:** Allows the left navigation bar to collapse into a slim icon-only rail (`w-16`), recovering over 80% of horizontal navigation width for video and coding.
2. **Right-Side Java Playground & Compiler:** An embedded split-screen code editor and execution terminal powered by the Piston API, enabling users to write, compile, and run Java code directly beside the video player with zero context switching.

---

## 2. Component Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Header Navigation                                    │
│  [Toggle Sidebar]   Daily Tracker        [Streak: 8]   [Java Playground Toggle] [Sync] │
├──────────────┬──────────────────────────────────────────┬──────────────────────────────┤
│              │                                          │                              │
│   Sidebar    │           Main Viewport                  │     Java Playground          │
│              │                                          │     (Right Panel)            │
│  Expanded    │   Course Learning Hub:                   │                              │
│  (w-60)      │   - VideoPlayerCard (YouTube IFrame)     │   - Code Editor              │
│      OR      │   - Chapter Syllabus & Progress          │   - Templates Dropdown       │
│  Collapsed   │                                          │   - Stdin Input Drawer       │
│  (w-16 rail) │   (Expands horizontally when             │   - [Run Code (Ctrl+Enter)]  │
│              │    sidebar folds or playground closes)   │   - Terminal Console Output  │
│              │                                          │                              │
└──────────────┴──────────────────────────────────────────┴──────────────────────────────┘
```

---

## 3. Section Details

### Section 3.1: Foldable Navigation Sidebar

#### 3.1.1 States & Behavior
* **Expanded State (`w-60` / `240px`):**
  * Full tab titles (`Daily Checklist`, `Streak Calendar`, `Course Hub`, etc.).
  * Section label headers (`NAVIGATION`).
  * Full category styling and badges.
* **Collapsed State (`w-16` / `64px`):**
  * Hides text labels and section headers cleanly.
  * Centers icons with subtle active indicator bars and glowing active badges.
  * Tooltips on hover: displays floating tab label so the user always knows what each icon represents.
* **Toggle Triggers:**
  * Header button: `<PanelLeftClose />` / `<PanelLeft />` icon beside the app logo.
  * Sidebar bottom/top toggle button.
  * Persisted in `localStorage` under `dt_sidebar_collapsed` (`boolean`).

#### 3.1.2 Files Touched
* `src/components/layout/Sidebar.tsx` (Add `isCollapsed` prop, conditional icon-only styling, hover tooltips).
* `src/components/layout/Header.tsx` (Add collapse toggle button for desktop).
* `src/components/layout/Layout.tsx` (Manage `isSidebarCollapsed` state, persistent load/save).

---

### Section 3.2: Right-Side Java Playground & Compiler Panel

#### 3.2.1 Core Features
1. **Monospace Code Editor:**
   * Line numbers, syntax-highlighted styles, tab indentation support (2 or 4 spaces).
   * Default boilerplate:
     ```java
     public class Main {
         public static void main(String[] args) {
             System.out.println("Hello, Java Masterclass!");
         }
     }
     ```
2. **Template Snippets:**
   * One-click dropdown to load starter code for course modules:
     * *Hello World & Variables*
     * *OOP & Classes (State, Constructors, Methods)*
     * *Exception Handling (try-catch-resources)*
     * *Multithreading (Runnable & Threads)*
     * *Collections (ArrayList & HashMap)*
     * *Stream API (filter, map, collect)*
     * *Scanner / Console Input Demo*
3. **Stdin Input Console:**
   * Collapsible input drawer for passing keyboard inputs when testing `Scanner` or `BufferedReader`.
4. **Execution Engine (Piston REST API):**
   * Endpoint: `https://emkc.org/api/v2/piston/execute`
   * Language: `java` (`15.0.2` OpenJDK runtime).
   * Payload:
     ```json
     {
       "language": "java",
       "version": "15.0.2",
       "files": [{ "name": "Main.java", "content": "..." }],
       "stdin": ""
     }
     ```
   * Handles compile errors (`stderr` with exit code `1`) and displays them in terminal red text.
   * Handles runtime output (`stdout`) in terminal green/cyan text.
   * Execution timer: shows compile & execution duration in milliseconds.
5. **Keyboard Shortcuts:**
   * `Ctrl + \` / `Cmd + \`: Toggle Java Playground on/off.
   * `Ctrl + Enter` / `Cmd + Enter`: Run and compile current code.

#### 3.2.2 State Management & Persistence
* Saved locally in `localStorage` (`dt_java_scratchpad_code`) so users never lose their uncommitted code or experiment snippets when navigating between tabs.
* Split view width: `w-[420px]` on desktop screens (`>= 1280px`) or full-overlay on smaller laptop screens (`< 1280px`).

---

## 4. Error Handling & Edge Cases

1. **Network Failure / Offline:** If the Piston execution API is unreachable, display a friendly alert with error diagnostics and allow code copying without losing inputs.
2. **Infinite Loops / Timeout:** Piston enforces a default 5000ms timeout on execution, terminating infinite loops safely with a timeout notice.
3. **Class Name Enforcement:** Java requires `public class Main` matching the file execution entry point. The editor automatically enforces or wraps `Main` as the top-level class.

---

## 5. Verification Plan

1. **Sidebar Collapse Verification:**
   * Toggle collapse state $\rightarrow$ verify smooth transition between `w-60` and `w-16`.
   * Verify all 7 tabs remain clickable and tooltips show correctly.
   * Refresh browser $\rightarrow$ verify collapse state is preserved from `localStorage`.
2. **Java Compiler Verification:**
   * Compile basic *Hello World* $\rightarrow$ verify stdout "Hello, Java Masterclass!" and 0 errors.
   * Compile invalid code (`int x = "abc";`) $\rightarrow$ verify compiler error output cleanly displayed in terminal box.
   * Test `Scanner` with custom stdin $\rightarrow$ verify program reads stdin and prints result.
   * Test keyboard shortcuts (`Ctrl + \`, `Ctrl + Enter`).
3. **Build & Typecheck:**
   * Run `npm run build` (`tsc && vite build`) to confirm zero compilation errors.
