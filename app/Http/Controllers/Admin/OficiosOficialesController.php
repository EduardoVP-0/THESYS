<?php

namespace App\Http\Controllers\Admin; 

use App\Http\Controllers\Controller;
use App\Models\Admin\Oficios_Oficiales;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OficiosOficialesController extends Controller
{
    //
    public function index() : Response
    {
        $oficios = Oficios_Oficiales::all();
        return Inertia::render('admin/oficios_oficiales/index', [
            'oficios' => $oficios,
        ]);
    } 
}
