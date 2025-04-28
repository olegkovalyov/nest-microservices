"use client"; // Mark this component as a Client Component

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Use shadcn button

export const Header: React.FC = () => {
  // Placeholder for authentication state
  const isLoggedIn = false; // TODO: Replace with actual auth state

  return (
    <header className="bg-background border-b sticky top-0 z-10">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo Placeholder */}
        <Link href="/" className="text-xl font-bold text-primary">
          EdTech
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-4">
          <Link href="/courses" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Courses
          </Link>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Dashboard
              </Link>
              <Button variant="outline" size="sm" onClick={() => alert('Logout clicked!')}> {/* // TODO: Implement logout */}
                Logout
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => alert('Login clicked!')}> {/* // TODO: Implement login */}
              Login / Sign Up
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
};
