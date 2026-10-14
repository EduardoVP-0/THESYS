import { Head, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { index, update } from '@/routes/products';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea"
import { Button } from '@/components/ui/button';



interface Product {
    id: number;
    nombre: string;
    descripcion: string;
    stock: number;
    precio: number;
}

export default function Edit({ product }: { product: Product }) {

    const { data, setData, put, processing, errors } = useForm({
        nombre: product.nombre,
        descripcion: product.descripcion,
        stock: product.stock,
        precio: product.precio
    })



    const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        put(update.url(product.id));
    }

    return (
        <>
            <Head title="Productos | Editar" />
            <div className='w-8/12 p-4'>
                <form onSubmit={handleUpdate} method='post' className='space-y-4'>
                    <div className='gap-1.5'>
                        <Input
                            placeholder='Nombre del Producto'
                            value={data.nombre}
                            onChange={e => setData('nombre', e.target.value)}
                        ></Input>
                        {errors.nombre && (
                            <div className='flex items-center text-red-500 text-sm mt-1'>{errors.nombre}</div>
                        )}
                    </div>
                    <div className='gap-1.5'>
                        <Input
                            placeholder='Stock del Producto'
                            value={data.stock}
                            onChange={e => setData('stock', Number(e.target.value))}
                        ></Input>
                        {errors.stock && (
                            <div className='flex items-center text-red-500 text-sm mt-1'>{errors.stock}</div>
                        )}
                    </div>
                    <div className='gap-1.5'>
                        <Input
                            placeholder='Precio del Producto'
                            value={data.precio}
                            onChange={e => setData('precio', Number(e.target.value))}
                        ></Input>
                        {errors.precio && (
                            <div className='flex items-center text-red-500 text-sm mt-1'>{errors.precio}</div>
                        )}
                    </div>
                    <div className='gap-1.5'>
                        <Textarea
                            placeholder='Descripcion del Producto'
                            value={data.descripcion}
                            onChange={e => setData('descripcion', e.target.value)}
                        />
                        {errors.descripcion && (
                            <div className='flex items-center text-red-500 text-sm mt-1'>{errors.descripcion}</div>
                        )}
                    </div>
                    <div>
                        <Button
                            disabled={processing}
                            type='submit'
                        >
                            Actualizar Producto
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

Edit.layout = ({ product }: { product: Product }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Productos',
            href: index(),
        },
        {
            title: 'Editar: ' + product.nombre,
        },
    ],
});

