// Server Component for generateStaticParams
export async function generateStaticParams() {
  // Return empty array for static export
  // All order confirmation pages will be client-side rendered
  return [];
}

export default function OrderConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
