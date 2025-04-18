import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProductById } from "@/lib/products";
import AddToCartForm from "@/components/add-to-cart-form";
import ChatbotButton from "@/components/chatbot-button";

// CategoryPageProps interface
interface ProductPageProps {
  params: {
    id: string;
  };
}

// ProductPage component using async/await for params
export default async function ProductPage({ params }: ProductPageProps) {
  // Await params to fix the error
  const { id } = params; // Destructure id from params

  // Fetch the product for the given id
  const product = await getProductById(id); // Await the product fetch

  // If the product is not found, return a 404
  if (!product) {
    notFound(); // Trigger a 404 if no product is found
  }

  return (
    <main className="flex-1">
      <div className="container px-4 py-8 md:py-12">
        <Button asChild variant="ghost" className="mb-6 gap-1">
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-lg border">
              <Image
                src={product.images[0] || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                {product.new && <Badge className="bg-blue-500 hover:bg-blue-600">New</Badge>}
                {product.sale && <Badge className="bg-red-500 hover:bg-red-600">Sale</Badge>}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <div key={index} className="aspect-square relative overflow-hidden rounded-md border cursor-pointer">
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <div className="mt-2 flex items-center">
                <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="ml-2 text-lg text-muted-foreground line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <p className="text-muted-foreground">{product.description}</p>

            <AddToCartForm product={product} />

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Heart className="h-5 w-5" />
                <span className="sr-only">Add to wishlist</span>
              </Button>
              <span className="text-sm text-muted-foreground">Add to Wishlist</span>
            </div>

            <Tabs defaultValue="description">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="shipping">Shipping</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="pt-4">
                <p>{product.description}</p>
              </TabsContent>
              <TabsContent value="details" className="pt-4">
                <ul className="space-y-2">
                  <li>
                    <span className="font-medium">Category:</span> {product.category}
                  </li>
                  {product.subcategory && (
                    <li>
                      <span className="font-medium">Subcategory:</span> {product.subcategory}
                    </li>
                  )}
                  {product.tags && (
                    <li>
                      <span className="font-medium">Tags:</span> {product.tags.join(", ")}
                    </li>
                  )}
                </ul>
              </TabsContent>
              <TabsContent value="shipping" className="pt-4">
                <p>
                  Free shipping on all orders over $50. Standard delivery takes 3-5 business days. Express shipping
                  options available at checkout.
                </p>
                <p className="mt-2">
                  Returns accepted within 30 days of delivery. Items must be unworn with original tags attached.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <ChatbotButton />
    </main>
  );
}
