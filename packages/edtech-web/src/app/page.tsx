// src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <section className="container mx-auto flex flex-col items-center justify-center text-center py-20 md:py-32">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
        Welcome to EdTech Platform
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
        Your journey to knowledge starts here. Explore our wide range of courses designed by industry experts.
      </p>
      <div className="flex items-center justify-center gap-x-4">
        <Link href="/courses" passHref>
          <Button size="lg" className="cursor-pointer">Browse Courses</Button>
        </Link>
        <Link href="/login" passHref>
          <Button size="lg" variant="outline" className="cursor-pointer">Login</Button>
        </Link>
        <Link href="/register" passHref>
          <Button size="lg" variant="outline" className="cursor-pointer">Register</Button>
        </Link>
      </div>
    </section>
  );
}
