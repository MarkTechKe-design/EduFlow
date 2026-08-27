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
    public function index(Request $request): Response
    {
        $query = WebsiteMedia::query()->latest('id');

        if ($request->filled('folder') && $request->folder !== 'all') {
            $query->where('folder', $request->folder);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('file_name', 'like', "%{$search}%")
                  ->orWhere('alt_text', 'like', "%{$search}%");
            });
        }

        $folders = WebsiteMedia::query()
            ->select('folder')
            ->distinct()
            ->whereNotNull('folder')
            ->pluck('folder')
            ->toArray();

        return Inertia::render('SuperAdmin/Website/Media/Index', [
            'media'   => $query->paginate(32)->withQueryString(),
            'folders' => array_values(array_filter($folders)),
            'filters' => $request->only(['folder', 'search']),
        ]);
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $request->validate([
            'file'     => ['required', 'file', 'max:51200'], // Up to 50MB
            'title'    => ['nullable', 'string', 'max:255'],
            'folder'   => ['nullable', 'string', 'max:100'],
            'alt_text' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        $originalName = $file->getClientOriginalName();
        $mimeType = $file->getMimeType();
        $size = $file->getSize();

        $folder = trim($request->input('folder', 'general'), '/');
        $fileName = Str::slug(Str::limit(pathinfo($originalName, PATHINFO_FILENAME), 35, '')) . '-' . Str::random(6) . '.' . $extension;

        $storagePath = $file->storeAs("media/{$folder}", $fileName, 'public');

        $inputTitle = $request->input('title', '');
        $safeTitle = (strlen($inputTitle) > 80 || preg_match('/^[a-zA-Z0-9\-_]{30,}/', $inputTitle))
            ? pathinfo($originalName, PATHINFO_FILENAME)
            : ($inputTitle ?: pathinfo($originalName, PATHINFO_FILENAME));

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

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Uploaded successfully.',
                'url'     => $media->url,
                'media'   => $media,
            ]);
        }

        return back()->with('success', 'Media uploaded successfully.');
    }

    public function update(Request $request, WebsiteMedia $medium): RedirectResponse
    {
        $validated = $request->validate([
            'title'    => ['required', 'string', 'max:255'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'folder'   => ['nullable', 'string', 'max:100'],
        ]);

        $medium->update($validated);

        return back()->with('success', 'Media asset updated successfully.');
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