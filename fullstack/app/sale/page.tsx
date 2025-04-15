// app/sale/page.tsx
import { products } from '../../lib/products';
import ProductCard from '../../components/product-card';

export default function SalePage() {
  const saleProducts = products.filter(product => product.sale); // Lọc các sản phẩm giảm giá.

  return (
    <div className="container px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Sale Products</h1>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">
        {saleProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
