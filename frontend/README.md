# Starknet VC Co-pilot Frontend

A modern, clean interface for getting AI-powered feedback on your startup pitch.

## Features

- 🔐 GitHub OAuth authentication
- 🎨 Modern dark theme with gradient accents
- 📄 PDF pitch deck upload support
- 💬 Real-time chat interface
- 🎭 Multiple VC personality types (more coming soon)
- 📱 Fully responsive design
- ✨ Smooth animations and transitions

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components inspired by shadcn/ui
- **Authentication**: NextAuth.js
- **Icons**: Lucide React
- **Package Manager**: Bun

## Setup

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Environment variables**:
   Copy `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   - `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `GITHUB_ID`: Your GitHub OAuth App ID
   - `GITHUB_SECRET`: Your GitHub OAuth App Secret
   - `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)

3. **GitHub OAuth Setup**:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set Homepage URL to `http://localhost:3000`
   - Set Authorization callback URL to `http://localhost:3000/api/auth/callback/github`
   - Copy the Client ID and Client Secret to your `.env.local`

4. **Run the development server**:
   ```bash
   bun run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── providers.tsx      # Context providers
├── components/            # Feature components
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint

## Customization

### Theme
The theme can be customized in `app/globals.css`. The app uses CSS variables for colors, making it easy to adjust the color scheme.

### Components
All UI components are in `app/components/ui/`. They're built with Tailwind CSS and can be easily modified.

## Deployment

The app is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import your repository on Vercel
3. Add your environment variables
4. Deploy!

## License

MIT