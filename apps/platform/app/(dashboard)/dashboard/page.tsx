// This is a simple Next.js page component written in TypeScript (TSX).
// It demonstrates a basic functional component using React and Tailwind CSS for styling.

// The default export is the page component that Next.js will render.
export default function HomePage() {
  return (
    // The main container for the page.
    // It uses Tailwind CSS classes for full height, centering content, and a light background.
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {/*
        This div acts as a card or content box.
        It has a white background, rounded corners, padding, and a subtle shadow.
        It also uses flexbox for internal centering of its content.
      */}
      <div className="bg-white p-8 rounded-lg shadow-md text-center flex flex-col items-center justify-center">
        {/*
          A heading for the page.
          Uses Tailwind classes for font size, weight, and text color.
        */}
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to Your Next.js Page!
        </h1>

        {/*
          A paragraph for descriptive text.
          Uses Tailwind classes for text size and color.
        */}
        <p className="text-lg text-gray-600 mb-6">
          This is a basic Next.js page built with React and styled using Tailwind CSS.
        </p>

        {/*
          A simple button.
          Uses Tailwind classes for background, text color, padding, rounded corners,
          and a hover effect for interactivity.
        */}
        
      </div>
    </div>
  );
}
