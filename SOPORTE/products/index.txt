import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { create, edit, destroy as destroyRoute } from '@/routes/products';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface Product {
    id: number;
    nombre: string;
    descripcion: string;
    stock: number;
    precio: number;
}


export default function Index({ products }: { products: Product[] }) {

    const { processing, delete: destroy } = useForm();

    const handleDelete = (id: number) => {
        if (confirm('¿Estas seguro de querer borrar este producto?')) {

            destroy(destroyRoute.url(id));
        }
    }

    return (
        <>
            <Head title="Productos | Lista" />

            <div className="m-4 flex items-center justify-between">
                <Link href={create()} className="btn btn-primary btn-sm">
                    + Crear Producto
                </Link>

                <div className="badge badge-neutral badge-outline">
                    Total: {products.length} {products.length === 1 ? 'producto' : 'productos'}
                </div>
            </div>

            {products.length === 0 ? (
                <div className="alert alert-info shadow-sm m-4">
                    <span>No hay productos registrados todavía. ¡Crea el primero con el botón superior!</span>
                </div>
            ) : (
                <Table>
                    <TableCaption>Listado de inventario de productos.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Descripcion</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">#{product.id}</TableCell>
                                <TableCell className="font-semibold">{product.nombre}</TableCell>
                                <TableCell className="text-muted-foreground">{product.descripcion}</TableCell>
                                <TableCell>
                                    {product.stock > 5 ? (
                                        <span className="badge badge-success badge-soft">
                                            {product.stock} en stock
                                        </span>
                                    ) : (
                                        <span className="badge badge-warning badge-soft">
                                            {product.stock} agotándose
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="font-mono">${Number(product.precio).toFixed(2)}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Link href={edit(product.id)} className="btn btn-sm btn-outline btn-neutral">
                                        Editar
                                    </Link>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-error btn-soft"
                                        onClick={() => handleDelete(product.id)}
                                        disabled={processing}
                                    >
                                        Eliminar
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

        </>
    );
}

Index.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Productos'
        }
    ],
};
