# 🎮 Game Nite

One-click game server provisioning for your frens. Instantly deploy and manage game servers on Railway.

## Features

- **🚀 Instant Deployment** - One-click server creation via Railway's API
- **🎯 Multiple Games** - Support for Minecraft, Rust, Factorio, and ARK: Survival Evolved
- **⚡ Quick Management** - Restart, delete, and monitor servers in real-time
- **🔗 Easy Sharing** - Generate shareable links with connection details

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Railway account with API token

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd game-nite
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and configure the following:

- `RAILWAY_API_TOKEN` - Get from [Railway account tokens](https://railway.app/account/tokens)
- `RAILWAY_PROJECT_ID` - Your Railway project ID (found in project settings)
- `RAILWAY_ENVIRONMENT_ID` - Your Railway environment ID (found in project settings)

4. Start development server:

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)
