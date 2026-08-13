# Deepwoods Green — GHG Sustainability Project Management Platform 🌿

A modern, enterprise-grade project management application designed specifically for GHG (Greenhouse Gas) sustainability teams, carbon accounting consultants, and environmental project managers. Built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Google Apps Script** for seamless real-time Google Sheets synchronization.

---

## ✨ Features & Modules

### 📊 Executive Dashboard
- **Real-Time Key Performance Metrics**:
  - `TOTAL TASKS`: Live tracking across all active sustainability projects.
  - `DUE TODAY`: Instant count of urgent pending tasks requiring immediate action.
  - `OVERDUE TASKS`: Proactive alert indicator for overdue deliverables.
  - `IN PROGRESS`: Active tasks currently under development.
  - `DONE / DATE RANGE`: Dynamic date range completion metrics (Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Custom Date Range).
- **Interactive Due Tasks Widget**: Switch between *Today*, *This Week*, and *Overdue* tasks with one click.
- **Dynamic Tasks Progress Donut Chart**: Interactive status breakdown with Recharts visualization.
- **Filterable Project Overview & Data Table**: Filter projects and task lists dynamically by project, assignee, priority, status, or date range.

### 📋 Interactive Kanban Board
- **Drag-and-Drop Workflow**: Powered by `@dnd-kit/core` and `@dnd-kit/sortable`.
- **4 Custom Workflows**: `To Do`, `In Progress`, `In Review`, `Done`.
- **Task Cards**: Feature project badges, subtask progress bars, priority badges, and assignee avatars.

### 📅 Gantt Chart Timeline
- **Interactive Scale Zooming**: Adjust timeline zoom from 35px/day to 90px/day.
- **Grouped by Project**: Color-coded progress pills with calculated start and due dates.
- **Collision-Free Text & Progress Badges**: Dynamic text truncation ensures zero overlap.

### 📜 Grouped Task List View
- **Collapsible Status Sections**: Organized by `To Do`, `In Progress`, `In Review`, and `Done`.
- **Outline Priority Badges**: High, Medium, and Low flags styled cleanly with zero heavy background fills.
- **Clickable Attachment Triggers**: Directly open and manage task files with one click.

### 📆 Calendar Schedule
- Monthly calendar schedule with task badges and add-task triggers on any date cell.

### 👥 Team & Role Settings
- Manage team members, custom roles, avatar colors, and email notification preferences.

### 🔄 Google Sheets Sync & Email Dispatch Log
- **Bi-Directional Google Sheets Sync**: Connects with Google Apps Script to auto-persist tasks, projects, and team data.
- **Email Notifications Drawer**: Real-time notification drawer logging dispatched reminder emails and updates.

---

## 🛠️ Tech Stack

- **Frontend Core**: React 18 + TypeScript + Vite 8
- **Styling & Layout**: Tailwind CSS + Lucide React Icons
- **Drag & Drop**: `@dnd-kit` (Core, Sortable, Utilities)
- **Charts**: Recharts (Interactive Donut & Pie Charts)
- **Date Handling**: `date-fns`
- **Backend / Database**: Google Apps Script (Web App Deployment) + Google Sheets API

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18.x or higher)
- npm / yarn / pnpm

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/prajeethvdp/Deepwoods-PM.git

# Navigate to project folder
cd Deepwoods-PM

# Install dependencies
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env` and update your environment variables:
```bash
cp .env.example .env
```

Set your configuration:
```env
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_SPREADSHEET_ID=YOUR_SPREADSHEET_ID
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
```

### 4. Development Server
Run the local Vite development server:
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.

### 5. Production Build
Verify TypeScript compilation and build production assets:
```bash
npm run build
```

---

## 📂 Project Structure

```
deepwoods-pm/
├── google-apps-script/     # Google Apps Script Code.gs backend script
├── public/                 # Optimized brand logos & static assets
├── src/
│   ├── components/         # UI components (Kanban, Gantt, Header, Sidebar, DetailPanel)
│   ├── context/            # DataContext & AuthContext state management
│   ├── lib/                # Constants, date utilities, and Google Sheets sync helpers
│   ├── pages/              # DashboardPage, ListViewPage, TeamPage, CalendarView
│   ├── types/              # TypeScript interfaces (Task, Project, TeamMember)
│   ├── App.tsx             # Main layout shell & tab routing
│   └── main.tsx            # Application entry point
├── package.json
├── README.md
└── vite.config.ts
```

---

## 📄 License

MIT License © 2026 Deepwoods Green
