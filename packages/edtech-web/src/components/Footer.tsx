import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-muted border-t mt-auto">
      <div className="container mx-auto px-4 py-4 text-center text-muted-foreground text-sm">
        {currentYear} EdTech Platform. All rights reserved.
      </div>
    </footer>
  );
};
