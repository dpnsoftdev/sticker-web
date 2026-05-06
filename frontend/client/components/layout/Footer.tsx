export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">
          © {new Date().getFullYear()} Dango&apos;s Corner. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
