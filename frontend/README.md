# SourceCraft Repo Health Frontend

Next.js 16 interface for the real Repo Health API. Ranking, repository
dashboard, category evidence, recommendations, analysis status, and report
downloads are backed by the NestJS service rather than fixtures.

## Getting Started

From the repository root, run the complete stack:

```bash
docker compose -p repo-health up -d --build
```

Open [http://localhost:3001](http://localhost:3001). The backend API and Swagger
remain available on ports `3000` and `/docs` respectively.

For a standalone development server, copy `.env.example` to `.env.local` and
run `npm run dev -- --port 3001` while the backend is available on port 3000.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
