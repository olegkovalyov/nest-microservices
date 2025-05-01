// src/app/register/page.tsx
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

import { signIn } from 'next-auth/react'; // Import signIn
import { useRouter } from 'next/navigation'; // Import useRouter for redirection
import { useState } from 'react'; // Import useState for error/loading

// 1. Define the validation schema using Zod
const registerFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }).max(50),
  lastName: z.string().min(1, { message: 'Last name is required.' }).max(50),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwords do not match.',
  path: ['passwordConfirm'], // Path to the field to attach the error message to
});

// Infer the TypeScript type from the schema
type RegisterFormValues = z.infer<typeof registerFormSchema>;

// Default values for the form
const defaultValues: Partial<RegisterFormValues> = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordConfirm: '',
};

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null); // State for error message
  const [isLoading, setIsLoading] = useState<boolean>(false); // State for loading indicator

  // 2. Define the form using react-hook-form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues,
    mode: 'onChange', // Validate on change for immediate feedback
  });

  // 3. Define a submit handler
  async function onSubmit(values: RegisterFormValues) {
    setError(null); // Clear previous errors
    setIsLoading(true);
    console.log('Submitting registration form:', values);

    try {
      // Use signIn for registration via CredentialsProvider
      const result = await signIn('credentials', {
        redirect: false, // Handle redirect manually
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        // No need to send confirmPassword to the backend
      });

      setIsLoading(false);

      if (result?.error) {
        // Handle errors (e.g., email already exists, backend validation)
        console.error('Registration SignIn Error:', result.error);
        setError(result.error || 'Registration failed. Please try again.');
      } else if (result?.ok) {
        // Registration successful
        console.log('Registration SignIn successful:', result);
        // Redirect to login page or a success page
        alert('Registration successful! Please log in.'); // Temporary feedback
        router.push('/login');
      } else {
        // Handle other unexpected cases
        setError('An unknown error occurred during registration.');
        console.error('Unknown Registration SignIn result:', result);
      }
    } catch (err) {
      setIsLoading(false);
      // Catch unexpected errors during the signIn process itself
      console.error('Exception during registration onSubmit:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 4. Build the form using shadcn/ui components */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Display error message */}
              {error && (
                <div className="text-red-500 text-sm p-3 bg-red-100 border border-red-400 rounded">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
              <FormField
                control={form.control}
                name="passwordConfirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                {isLoading ? 'Registering...' : 'Create Account'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Login here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
