const { z } = require('zod');
const empty = z.object({});
const idParams = z.object({ id: z.string().min(1) });
const productFields = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  storeId: z.string().min(1),
  categoryId: z.string().min(1),
});
const categoryFields = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});
const storeFields = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  imageUrl: z.string().url().optional().or(z.literal('')),
});
const envelope = (body, params = empty, query = empty) => z.object({ body, params, query });
module.exports = {
  login: envelope(z.object({ email: z.string().email(), password: z.string().min(6) })),
  register: envelope(z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6) })),
  id: envelope(empty, idParams),
  productData: envelope(productFields),
  productUpdate: envelope(productFields, idParams),
  categoryData: envelope(categoryFields),
  categoryUpdate: envelope(categoryFields, idParams),
  storeData: envelope(storeFields),
  storeUpdate: envelope(storeFields, idParams),
  listProducts: envelope(
    empty,
    empty,
    z.object({
      search: z.string().optional(),
      categoryId: z.string().optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    })
  ),
  order: envelope(z.object({ address: z.string().min(5).optional() })),
  status: envelope(z.object({ status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']) }), idParams),
  listUsers: envelope(
    empty,
    empty,
    z.object({
      search: z.string().optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    })
  ),
  userUpdate: envelope(z.object({ name: z.string().min(2), role: z.enum(['USER', 'ADMIN']) }), idParams),
  cartAdd: envelope(
    z.object({ productId: z.string().min(1), quantity: z.coerce.number().int().positive().max(99).default(1) })
  ),
  cartUpdate: envelope(
    z.object({ quantity: z.coerce.number().int().positive().max(99) }),
    z.object({ productId: z.string().min(1) })
  ),
  cartProduct: envelope(empty, z.object({ productId: z.string().min(1) })),
  favoriteProduct: envelope(empty, z.object({ productId: z.string().min(1) })),
};
