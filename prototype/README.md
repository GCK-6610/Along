# Along - UI/UX React Prototype

This folder contains the interactive React + Vite prototype for the Along application, styled with Tailwind CSS v4 and designed around our Figma layout wireframes.

---

## 🚀 Getting Started

Follow these steps to run the interactive prototype on your local machine.

### Prerequisites
* Ensure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended).

### 1. Install Dependencies
Open your terminal in this directory (`prototype/`) and run:
```bash
npm install
```

### 2. Start the Development Server
Run the local Vite runner:
```bash
npm run dev
```
Once started, open [http://localhost:5173/](http://localhost:5173/) in your browser to inspect the application.

---

## 📂 Code & Layout Structure

The codebase is streamlined to make it easy to modify styles and mock flows:
* **[App.tsx](src/app/App.tsx)**: The single main entry point containing all application layouts, tab routing, and state definitions (such as NLP parsing logic, dynamic messaging grids, and GPS check-ins).
* **[default_shadcn_theme.css](default_shadcn_theme.css)**: Holds the CSS styling tokens and root theme parameters (Tailwind v4 base rules).
* **[vite.config.ts](vite.config.ts)**: Configures the Vite asset compiler and Tailwind CSS integrations.