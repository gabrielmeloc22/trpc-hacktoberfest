import Head from 'next/head';
import type { ReactNode } from 'react';

type DefaultLayoutProps = { children: ReactNode };

export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <>
      <Head>
        <title>Chirp</title>
        <meta
          name="description"
          content="A Twitter-like social media platform built with Next.js, tRPC, and Prisma"
        />
      </Head>

      <main className="h-screen">{children}</main>
    </>
  );
};
