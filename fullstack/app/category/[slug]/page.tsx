import { notFound } from "next/navigation";
import { getProductsByCategory } from "@/lib/products"; // This fetches the products
import ProductCard from "@/components/product-card";
import ChatbotButton from "@/components/chatbot-button";

// CategoryPageProps interface
interface CategoryPageProps {
  params: {
    slug: string;
  };
}

// Use async/await in your dynamic routes
export default async function CategoryPage({ params }: CategoryPageProps) {
  // Await the params object
  const { slug } = await params; // Await the dynamic route params here

  // Fetch the products for the category using async function
  const products = await getProductsByCategory(slug); // Ensure this is not an async function directly

  // If no products are found, return a 404
  if (products.length === 0) {
    notFound(); // Trigger a 404 if no products found
  }

  // Define category names for display
  const categoryNames: Record<string, string> = {
    men: "Men's Fashion",
    women: "Women's Fashion",
    accessories: "Accessories",
  };

  // Set category name based on slug or use slug itself
  const categoryName = categoryNames[slug] || slug;

  // Return the component with fetched products
  return (
    <main className="flex-1">
      <div className="container px-4 py-8 md:py-12">
        <h1 className="text-3xl font-bold mb-6">{categoryName}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
      <ChatbotButton />
    </main>
  );
}
