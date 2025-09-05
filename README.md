# OmniPost

**Write once. Publish everywhere.**  

A modern, powerful social media management platform that lets you compose, schedule, A/B test, and analyze posts across **Discord**, **Telegram**, and **Whop**. Built with Next.js and designed for both **standalone deployment** and **Whop-embedded experiences**.

![OmniPost Demo](https://img.shields.io/badge/demo-available-brightgreen)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-strict-blue)
![Next.js](https://img.shields.io/badge/next.js-15.x-black)

## ✨ Features

### Core Capabilities
- 🚀 **Multi-Platform Publishing**: Discord, Telegram, and Whop with platform-specific optimizations
- 📅 **Smart Scheduling**: AI-powered best time recommendations with timezone awareness
- 🧪 **A/B Testing**: Built-in experimentation with clear winner detection
- 📊 **Analytics**: Comprehensive metrics with timing heatmaps and performance insights
- 🤖 **AI Enhancement**: Content optimization, hashtag suggestions, and automated improvements
- 🛡️ **Quality Guardrails**: Link validation, duplicate detection, and content safety checks

### Deployment Modes
- **Standalone SaaS**: Full-featured deployment on your own domain
- **Whop Embedded**: Native integration as a Whop experience with subscription management

### Advanced Features
- **Automation Engine**: Rule-based workflows with dry-run testing
- **Content Library**: Templates, snippets, and asset management with version history
- **Team Collaboration**: Approval workflows, role-based access, and activity tracking
- **Developer API**: Full REST API with webhooks for integrations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- PostgreSQL database (or PostgREST endpoint)
- Platform API credentials (Discord, Telegram, Whop)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/omnipost.git
   cd omnipost
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the app.

### First Steps
1. 🏠 **Visit the Dashboard** - Overview of your publishing pipeline
2. 🔗 **Connect Platforms** - Go to Settings → Connections to add Discord, Telegram, or Whop
3. ✍️ **Create Your First Post** - Use the Composer to craft content with live previews
4. 📅 **Schedule or Publish** - Choose optimal timing or publish immediately
5. 📊 **Review Analytics** - Track performance and engagement metrics

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run dev:debug    # Start with Node.js debugging

# Building
npm run build        # Create production build
npm start           # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix auto-fixable linting issues
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript checks
npm run check        # Run all checks (type, lint, format)

# Testing
npm test            # Run unit tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e    # Run end-to-end tests
```

### Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── ui/              # Reusable UI components
│   ├── composer/        # Post composition components
│   └── analytics/       # Analytics components
├── lib/                # Utilities and core logic
│   ├── platform-integrations.ts # Platform publishing logic
│   ├── ai-service.ts    # AI-powered features
│   └── auth.ts          # Authentication system
├── types/              # TypeScript type definitions
└── constants/          # App constants and config
```

### Configuration

Key environment variables:

```bash
# Core Application
NEXT_PUBLIC_APP_NAME=OmniPost
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication & Security
JWT_SECRET=your_jwt_secret_here
ENABLE_AUTH=true

# Database
POSTGREST_URL=your_postgrest_endpoint
POSTGREST_API_KEY=your_api_key

# Platform Integration
DISCORD_CLIENT_ID=your_discord_client_id
TELEGRAM_BOT_TOKEN=your_telegram_token
WHOP_API_KEY=your_whop_api_key
```

See `.env.example` for the complete list of configuration options.

## 🌐 Deployment

OmniPost can be deployed in two ways:

### Standalone Deployment

Deploy as an independent SaaS platform:

- **Vercel** (Recommended) - Automatic deployments from Git
- **Docker** - Container-based deployment
- **Traditional VPS** - Direct server deployment with PM2

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Whop Embedded Experience

Run as a native Whop application:

1. Configure your Whop app in the developer dashboard
2. Set iframe URL to `https://your-domain.com/whop`
3. Configure webhook endpoint for subscription management
4. Test the embedded experience flow

## 📜 API Documentation

OmniPost provides a comprehensive REST API for integrations:

```bash
# Posts Management
GET    /next_api/posts              # List posts
POST   /next_api/posts              # Create post
GET    /next_api/posts/{id}         # Get post details
PUT    /next_api/posts/{id}         # Update post
DELETE /next_api/posts/{id}         # Delete post

# Publishing
POST   /next_api/posts/{id}/publish # Publish post
POST   /next_api/posts/{id}/schedule # Schedule post

# Analytics
GET    /next_api/analytics/metrics  # Get metrics
GET    /next_api/analytics/dashboard # Dashboard data

# Platform Connections
GET    /next_api/platform-connections # List connections
POST   /next_api/platform-connections/setup # Add connection

# System Health
GET    /next_api/system/health      # Health check
```

Authentication via JWT tokens. See API documentation for detailed schemas.

## 🧪 Testing

### Demo Mode
OmniPost includes a comprehensive demo mode with:
- Realistic sample content
- Simulated publishing (no real posts sent)
- One-click reset/reseed functionality
- Clear "Demo Mode" indicators

Access via: `http://localhost:3000?demo=true`

### Running Tests

```bash
# Unit Tests
npm test
npm run test:watch
npm run test:coverage

# E2E Tests
npm run test:e2e

# Type Checking
npm run type-check

# Linting
npm run lint
```

## 🔍 Architecture

### Key Components
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first styling
- **PostgREST** - Auto-generated REST API from PostgreSQL
- **JWT Authentication** - Secure token-based auth
- **Platform Integrations** - Modular publishing system

### Core Concepts
- **Workspace** - Team boundary and settings container
- **Post** - Content with platform-specific variants
- **Schedule** - Timezone-aware publishing times
- **Experiment** - A/B testing framework
- **Connection** - Platform integration credentials
- **Asset** - Media files with metadata and validation

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines
- Write TypeScript with strict mode enabled
- Add tests for new functionality
- Follow the existing code style
- Update documentation as needed
- Ensure builds pass before submitting

### Reporting Issues
- Use clear, descriptive titles
- Include steps to reproduce
- Specify your environment (OS, Node version, etc.)
- Add screenshots for UI issues

## 🔒 Security

- **Responsible Disclosure**: Report vulnerabilities via GitHub Security tab
- **JWT Security**: Tokens use HS256 with secure secrets
- **Data Protection**: User data is isolated by workspace
- **Platform Safety**: All integrations use official APIs
- **Input Validation**: Comprehensive content validation

## 🗺 Roadmap

### Upcoming Features
- [ ] Additional platforms (X/Twitter, LinkedIn, Reddit)
- [ ] Advanced analytics with custom metrics
- [ ] White-label customization options
- [ ] Mobile app for iOS and Android
- [ ] Enterprise SSO integration
- [ ] Custom webhook destinations

### Performance Improvements
- [ ] Edge caching for analytics
- [ ] Background job processing
- [ ] Real-time collaboration
- [ ] Offline-first mobile experience

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- **Documentation**: Check the `/docs` folder and `DEPLOYMENT.md`
- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Available for enterprise inquiries

---

**Built with ❤️ by the OmniPost team**

Made for creators who value simplicity, reliability, and results.
