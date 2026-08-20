<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\WebsiteMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class WebsiteMediaController extends Controller
{
    public function index(): Response
    {
        $media = WebsiteMedia::query()
            ->latest('id')
            ->paginate(24)
            ->withQueryString();

        return Inertia::render('SuperAdmin/Website/Media/Index', [
            'media' => $media,
        ]);
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        try {
            $request->validate([
                'file'     => ['required', 'file', 'max:51200'], // Up to 50MB
                'title'    => ['nullable', 'string', 'max:1000'],
                'folder'   => ['nullable', 'string', 'max:100'],
                'alt_text' => ['nullable', 'string', 'max:255'],
            ]);

            $file = $request->file('file');
            $extension = $file->getClientOriginalExtension();
            $originalName = $file->getClientOriginalName();
            $mimeType = $file->getMimeType();
            $size = $file->getSize();

            $folder = $request->input('folder', 'website');
            $fileName = Str::slug(Str::limit(pathinfo($originalName, PATHINFO_FILENAME), 35, '')) . '-' . Str::random(6) . '.' . $extension;
            
            $storagePath = $file->storeAs("media/{$folder}", $fileName, 'public');
            $publicUrl = Storage::disk('public')->url($storagePath);

            // If the incoming title is a giant ugly hash string, use a clean fallback title
            $inputTitle = $request->input('title', '');
            $safeTitle = (strlen($inputTitle) > 80 || preg_match('/^[a-zA-Z0-9\-_]{30,}/', $inputTitle)) 
                ? 'EduFlow Article Media Asset' 
                : ($inputTitle ?: 'EduFlow Media Asset');

            $media = WebsiteMedia::create([
                'public_id'   => (string) Str::uuid(),
                'disk'        => 'public',
                'path'        => $storagePath,
                'file_name'   => $fileName,
                'mime_type'   => $mimeType,
                'size'        => $size,
                'folder'      => $folder,
                'title'       => $safeTitle,
                'alt_text'    => Str::limit($request->input('alt_text'), 255, ''),
                'uploaded_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Uploaded successfully.',
                'url'     => $publicUrl,
                'media'   => $media,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function destroy(WebsiteMedia $medium): RedirectResponse
    {
        if (Storage::disk($medium->disk ?? 'public')->exists($medium->path)) {
            Storage::disk($medium->disk ?? 'public')->delete($medium->path);
        }

        $medium->delete();

        return back()->with('success', 'Media asset removed.');
    }
}