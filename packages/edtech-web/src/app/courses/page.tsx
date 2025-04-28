// src/app/courses/page.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; 
import { Button } from '@/components/ui/button'; 
import { Metadata } from 'next';

// Import course data from the JSON file
import coursesData from '@/data/data.json';

export const metadata: Metadata = {
  title: 'Our Courses - EdTech Platform',
  description: 'Browse our available courses.',
};

// Define a type for the course data for better type safety
interface Course {
  id: string;
  title: string;
  imageUrl: string;
  shortDescription: string;
  price14Days: number;
  priceMonthly: number;
  fullDescription: string; 
}

// Cast the imported data to our defined type
const courses: Course[] = coursesData;

export default function CoursesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Our Courses</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course, index) => (
          <Card key={course.id} className="flex flex-col">
            <CardHeader>
              <div className="relative w-full h-40 mb-4">
                <Image
                  src={course.imageUrl}
                  alt={`Cover image for ${course.title}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-t-lg"
                  priority={index < 3}
                />
              </div>
              <CardTitle>{course.title}</CardTitle>
              {/* Display the short description */}
              <CardDescription>{course.shortDescription}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {/* Content can go here if needed later */}
            </CardContent>
            <CardFooter className="flex justify-between items-center mt-auto pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <p>14 days: ${course.price14Days.toFixed(2)}</p>
                <p>Monthly: ${course.priceMonthly.toFixed(2)}</p>
              </div>
              <Link href={`/courses/${course.id}`} passHref>
                <Button size="sm" className="cursor-pointer"> 
                  View Details
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
