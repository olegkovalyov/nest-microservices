// src/app/courses/[courseId]/page.tsx
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link'; 
import { notFound } from 'next/navigation'; 
import coursesData from '@/data/data.json'; 
import { Button } from '@/components/ui/button'; 

interface Course {
  id: string;
  title: string;
  imageUrl: string;
  shortDescription: string;
  price14Days: number;
  priceMonthly: number;
  fullDescription: string;
}

const courses: Course[] = coursesData;

function getCourseById(id: string): Course | undefined {
  return courses.find(course => course.id === id);
}

export async function generateMetadata({ params: { courseId } }: { params: { courseId: string } }): Promise<Metadata> {
  const course = getCourseById(courseId);

  if (!course) {
    return {
      title: 'Course Not Found',
    };
  }

  return {
    title: `${course.title} - EdTech Platform`,
    description: course.shortDescription, 
  };
}

export default function CourseDetailPage({ params: { courseId } }: { params: { courseId: string } }) {
  const course = getCourseById(courseId);

  if (!course) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/courses" passHref>
          <Button variant="outline" className="cursor-pointer">
            &larr; Back to Courses 
          </Button>
        </Link>
      </div>

      <article className="max-w-3xl mx-auto">
        <div className="relative w-full h-64 md:h-80 mb-6 rounded-lg overflow-hidden">
          <Image
            src={course.imageUrl}
            alt={`Cover image for ${course.title}`}
            fill
            style={{ objectFit: 'cover' }}
            priority 
          />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>

        <div className="bg-muted p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold mb-2">Pricing</h2>
          <p>14-Day Access: <span className="font-bold">${course.price14Days.toFixed(2)}</span></p>
          <p>Monthly Subscription: <span className="font-bold">${course.priceMonthly.toFixed(2)}</span></p>
          <Button className="mt-4 cursor-pointer">Subscribe Now</Button>
        </div>

        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-semibold mb-3">Course Details</h2>
          <p>{course.fullDescription}</p>
        </div>

      </article>
    </div>
  );
}
