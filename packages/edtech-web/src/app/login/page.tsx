// src/app/login/page.tsx
'use client'; // Required for react-hook-form and client-side interactivity

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';

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
  password: z.string().min(1, { message: 'Password is required.' }), // Min 1 char for login
});

// Infer the TypeScript type from the schema
type LoginFormValues = z.infer<typeof loginFormSchema>;

// Default values for the form
const defaultValues: Partial<LoginFormValues> = {
  email: '',
  password: '',
};

export default function LoginPage() {
  // 2. Define the form using react-hook-form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues,
    mode: 'onChange', // Validate on change
  });

  // 3. Define a submit handler (placeholder)
  function onSubmit(values: LoginFormValues) {
    // IMPORTANT: Replace with your actual login logic (e.g., API call)
    console.log('Login Form Submitted:', values);
    // Simulate API call
    alert(`Login submitted!\nCheck console for details.`);
    // Reset form or redirect user after successful login
    // form.reset(); 
    // For example, redirect to dashboard: router.push('/dashboard');
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
              <Button type="submit" className="w-full cursor-pointer">
                Log In
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
