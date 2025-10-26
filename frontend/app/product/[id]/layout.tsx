// Server Component for generateStaticParams
export async function generateStaticParams() {
  // Return empty array for static export
  // All product pages will be client-side rendered
  return [];
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
