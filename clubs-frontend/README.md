# Club Executive Portal - Frontend

A beautiful multi-route React application for club executives to manage clubs and events.

## Features

### Authentication

- **Login/Register**: JWT-based authentication with token storage
- **Protected Routes**: Automatic redirect to login for unauthenticated users

### Club Management

- Create new clubs (creator becomes exec with founder role)
- View club details by UID
- Edit club information (name, budget, social media links)
- View club members with their roles and types

### Event Management

- Create events (standalone or linked to clubs)
- View event details by UID
- Edit event information
- Support for in-person and online events
- Event status tracking (scheduled, ongoing, completed, cancelled)
- Link events to clubs (exec-only creation for club events)

### Dashboard

- Quick access to club and event management
- User profile information display
- Navigation to all key features

## Tech Stack

- **React 19** - UI framework
- **React Router** - Client-side routing
- **Axios** - API communication
- **Vanilla CSS** - Styling with custom color scheme
- **Vite** - Build tool and dev server

## Color Scheme

```css
--background: #090917 (Dark blue-black)
--accent: #00a1ff (Bright blue)
--on-background: #ffffff (White)
--on-accent: #000000 (Black)
```

## Getting Started

### Prerequisites

- Node.js 16+ installed
- Flask backend running on `http://127.0.0.1:5000`

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## API Integration

The app connects to a Flask backend with the following endpoints:

**Auth:** `POST /auth/register`, `POST /auth/login`, `GET /auth/me`

**Clubs:** `POST /clubs/`, `GET /clubs/:uid`, `PUT /clubs/:uid`, `POST /clubs/:uid/join`, `GET /clubs/:uid/members`

**Events:** `POST /events/`, `GET /events/:uid`, `PUT /events/:uid`, `POST /events/:uid/join`

## Usage Flow

1. **Register/Login** - Create account or login with existing credentials
2. **Dashboard** - View overview and navigate to features
3. **Create Club** - Start a new club (automatically become exec)
4. **Create Event** - Create events (optionally link to club)
5. **Manage** - Edit clubs/events and view members/participants

## Design Features

- **Glass-morphism UI** - Semi-transparent cards with backdrop blur
- **Smooth Animations** - Hover effects and transitions
- **Responsive Design** - Works on desktop and mobile
- **Status Badges** - Color-coded event statuses
- **Role Indicators** - Visual badges for execs and members

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
