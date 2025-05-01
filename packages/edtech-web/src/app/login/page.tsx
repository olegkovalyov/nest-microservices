// src/app/login/page.tsx
'use client'; // Required for react-hook-form and client-side interactivity

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// 1. Define the validation schema using Zod
const loginFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

// Infer the TypeScript type from the schema
type LoginFormValues = z.infer<typeof loginFormSchema>;

// Default values for the form
const defaultValues: Partial<LoginFormValues> = {
  email: '',
  password: '',
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 2. Define the form using react-hook-form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues,
    mode: 'onChange', // Validate on change
  });

  // 3. Define a submit handler
  async function onSubmit(values: LoginFormValues) {
    setError(null); // Clear previous errors
    setIsLoading(true);
    console.log('Submitting login form:', values);

    try {
      // Use signIn from next-auth
      const result = await signIn('credentials', {
        redirect: false, // Prevent automatic redirect, handle manually
        email: values.email,
        password: values.password,
      });

      setIsLoading(false);

      if (result?.error) {
        // Handle authentication errors (e.g., wrong password)
        console.error('SignIn Error:', result.error);
        setError(result.error || 'Invalid email or password.');
      } else if (result?.ok) {
        // Login successful
        console.log('SignIn successful:', result);
        // Redirect to a protected page, e.g., dashboard or home
        router.push('/'); // Or '/dashboard'
        router.refresh(); // Optional: Refresh server components
      } else {
        // Handle other unexpected cases
        setError('An unknown error occurred during login.');
        console.error('Unknown SignIn result:', result);
      }
    } catch (err) {
      setIsLoading(false);
      // Catch unexpected errors during the signIn process itself
      console.error('Exception during onSubmit:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm"> {/* Slightly smaller card for login */} 
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Log In</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 4. Build the form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Display error message */}
              {error && (
                <div className="text-red-500 text-sm p-3 bg-red-100 border border-red-400 rounded">
                  {error}
                </div>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          Don't have an account?{' '}
          <Link href="/register" className="underline">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
