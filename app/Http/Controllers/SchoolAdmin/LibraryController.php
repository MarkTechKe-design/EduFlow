<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookIssue;
use App\Models\Staff;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LibraryController extends Controller
{
    public function index(Request $request): Response
    {
        $sid = $this->getSchoolId();

        $books = Book::where('school_id', $sid)
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sq) use ($search) {
                    $sq->where('title', 'like', "%{$search}%")
                       ->orWhere('author', 'like', "%{$search}%")
                       ->orWhere('isbn', 'like', "%{$search}%")
                       ->orWhere('category', 'like', "%{$search}%");
                });
            })
            ->when($request->category && $request->category !== 'all', fn ($q) => $q->where('category', $request->category))
            ->orderBy('title')
            ->paginate(25, ['*'], 'books_page')
            ->withQueryString();

        $issues = BookIssue::with(['book:id,title,author,isbn,location'])
            ->where('school_id', $sid)
            ->when($request->status && $request->status !== 'all', fn ($q) => $q->where('status', $request->status))
            ->latest('issued_date')
            ->paginate(25, ['*'], 'issues_page')
            ->withQueryString();

        $issues->getCollection()->transform(function ($issue) use ($sid) {
            if ($issue->member_type === 'student' || $issue->member_type === Student::class) {
                $student = Student::where('school_id', $sid)->find($issue->member_id);
                $issue->member_name = $student ? "{$student->first_name} {$student->last_name} ({$student->admission_no})" : "Student #{$issue->member_id}";
                $issue->member_class = $student?->schoolClass?->name ?? '—';
            } else {
                $staff = Staff::where('school_id', $sid)->find($issue->member_id);
                $issue->member_name = $staff ? "{$staff->first_name} {$staff->last_name} (Staff)" : "Staff #{$issue->member_id}";
                $issue->member_class = 'Staff Member';
            }
            return $issue;
        });

        $totalCopies = Book::where('school_id', $sid)->sum('total_copies');
        $availableCopies = Book::where('school_id', $sid)->sum('available_copies');
        $issuedCount = BookIssue::where('school_id', $sid)->where('status', 'issued')->count();
        $overdueCount = BookIssue::where('school_id', $sid)->where('status', 'issued')->where('due_date', '<', Carbon::today()->toDateString())->count();

        $lostUnpaidQuery = BookIssue::where('school_id', $sid)->where('status', 'lost');
        if (Schema::hasColumn('book_issues', 'fine_status')) {
            $lostUnpaidQuery->where('fine_status', 'unpaid');
        }
        $lostUnpaidCount = $lostUnpaidQuery->count();

        $stats = [
            'total_titles'     => Book::where('school_id', $sid)->count(),
            'total_copies'     => (int) $totalCopies,
            'available_copies' => (int) $availableCopies,
            'currently_issued' => $issuedCount,
            'overdue_count'    => $overdueCount,
            'lost_unpaid'      => $lostUnpaidCount,
        ];

        $categories = Book::where('school_id', $sid)
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category');

        return Inertia::render('SchoolAdmin/Library/Index', [
            'books'      => $books,
            'issues'     => $issues,
            'categories' => $categories,
            'students'   => Student::where('school_id', $sid)->where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'admission_no']),
            'staffList'  => Staff::where('school_id', $sid)->where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'emp_id']),
            'stats'      => $stats,
            'filters'    => $request->only('search', 'category', 'status'),
        ]);
    }

    public function issues(Request $request): Response
    {
        return $this->index($request);
    }

    public function overdue(Request $request): Response
    {
        $request->merge(['status' => 'overdue']);
        return $this->index($request);
    }

    public function storeBook(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'author'           => 'required|string|max:255',
            'isbn'             => 'nullable|string|max:50',
            'publisher'        => 'nullable|string|max:255',
            'category'         => 'nullable|string|max:100',
            'edition'          => 'nullable|string|max:50',
            'total_copies'     => 'required|integer|min:1',
            'location'         => 'nullable|string|max:100',
            'price'            => 'nullable|numeric|min:0',
            'description'      => 'nullable|string',
        ]);

        $validated['school_id'] = $sid;
        $validated['available_copies'] = $validated['total_copies'];
        $validated['is_active'] = true;

        Book::create($validated);

        return redirect()->route('school.library.index')
            ->with('success', 'Book added to library successfully.');
    }

    public function updateBook(Request $request, Book $book): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $book->school_id === $sid, 404);

        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'author'       => 'required|string|max:255',
            'isbn'         => 'nullable|string|max:50',
            'publisher'    => 'nullable|string|max:255',
            'category'     => 'nullable|string|max:100',
            'edition'      => 'nullable|string|max:50',
            'total_copies' => 'required|integer|min:1',
            'location'     => 'nullable|string|max:100',
            'price'        => 'nullable|numeric|min:0',
            'description'  => 'nullable|string',
        ]);

        $borrowedDifference = $book->total_copies - $book->available_copies;
        $newAvailable = max(0, $validated['total_copies'] - $borrowedDifference);
        $validated['available_copies'] = $newAvailable;

        $book->update($validated);

        return redirect()->route('school.library.index')
            ->with('success', 'Book updated successfully.');
    }

    public function destroyBook(Book $book): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $book->school_id === $sid, 404);

        $book->delete();

        return redirect()->route('school.library.index')
            ->with('success', 'Book removed from library.');
    }

    public function issueBook(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $validated = $request->validate([
            'book_id'     => 'required|integer',
            'member_type' => 'required|string',
            'member_id'   => 'required|integer',
            'issued_date' => 'required|date',
            'due_date'    => 'required|date|after_or_equal:issued_date',
            'note'        => 'nullable|string',
        ]);

        $book = Book::where('school_id', $sid)->findOrFail($validated['book_id']);

        if ($book->available_copies < 1) {
            return back()->withErrors(['book_id' => 'No copies of this book are currently available for issue.']);
        }

        if (in_array($validated['member_type'], ['student', Student::class], true)) {
            Student::where('school_id', $sid)->findOrFail($validated['member_id']);
            $memberClass = Student::class;
        } else {
            Staff::where('school_id', $sid)->findOrFail($validated['member_id']);
            $memberClass = Staff::class;
        }

        $noteCol = Schema::hasColumn('book_issues', 'note') ? 'note' : 'notes';

        BookIssue::create([
            'school_id'    => $sid,
            'book_id'      => $book->id,
            'member_type'  => $memberClass,
            'member_id'    => $validated['member_id'],
            'issued_date'  => $validated['issued_date'],
            'due_date'     => $validated['due_date'],
            'status'       => 'issued',
            'fine_status'  => 'unpaid',
            'fine_per_day' => 2.00,
            $noteCol       => $validated['note'] ?? null,
        ]);

        $book->decrement('available_copies');

        return redirect()->route('school.library.index')
            ->with('success', "Book '{$book->title}' issued successfully.");
    }

    public function returnBook(Request $request, BookIssue $issue): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $issue->school_id === $sid, 404);

        $returnDate = $request->input('returned_date', now()->toDateString());
        $fineAmount = (float) $request->input('late_fine', 0);

        $issue->update([
            'status'        => 'returned',
            'returned_date' => $returnDate,
            'fine'          => $fineAmount,
            'fine_amount'   => $fineAmount,
            'fine_status'   => $fineAmount > 0 ? 'unpaid' : 'paid',
        ]);

        if ($issue->book) {
            $issue->book->increment('available_copies');
        }

        return redirect()->route('school.library.index')
            ->with('success', 'Book marked as returned.');
    }

    public function markLost(Request $request, BookIssue $issue): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $issue->school_id === $sid, 404);

        $fineAmount = (float) $request->input('replacement_charge', 1200);
        $issue->update([
            'status'      => 'lost',
            'fine'        => $fineAmount,
            'fine_amount' => $fineAmount,
            'fine_status' => 'unpaid',
            'note'        => $request->input('note', 'Reported lost by borrower'),
        ]);

        return redirect()->route('school.library.index')
            ->with('success', 'Book marked as lost with replacement fee assigned.');
    }

    public function clearFine(Request $request, BookIssue $issue): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $issue->school_id === $sid, 404);

        $issue->update([
            'fine_status'  => 'paid',
            'fine_paid_at' => now(),
        ]);

        return redirect()->route('school.library.index')
            ->with('success', 'Fine cleared successfully.');
    }

    public function checkStudentClearance(Student $student): JsonResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $student->school_id === $sid, 404);

        $activeIssues = BookIssue::where('school_id', $sid)
            ->where('member_type', Student::class)
            ->where('member_id', $student->id)
            ->where('status', 'issued')
            ->with('book:id,title,isbn')
            ->get();

        $unpaidLost = BookIssue::where('school_id', $sid)
            ->where('member_type', Student::class)
            ->where('member_id', $student->id)
            ->where('status', 'lost')
            ->where('fine_status', 'unpaid')
            ->with('book:id,title,isbn')
            ->get();

        $totalLiability = $unpaidLost->sum(function ($i) {
            return (float) ($i->fine_amount ?: $i->fine);
        });

        return response()->json([
            'cleared'         => ($activeIssues->isEmpty() && $unpaidLost->isEmpty()),
            'active_borrowed' => $activeIssues,
            'unpaid_lost'     => $unpaidLost,
            'total_liability' => $totalLiability,
        ]);
    }

    /**
     * Export all book catalog records to CSV format.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $sid = $this->getSchoolId();
        $fileName = 'Library_Catalog_' . date('Y_m_d_His') . '.csv';

        $books = Book::where('school_id', $sid)
            ->orderBy('title')
            ->get();

        return response()->streamDownload(function () use ($books) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for Excel
            fputs($handle, "\xEF\xBB\xBF");

            // CSV Headers
            fputcsv($handle, [
                'Book Title',
                'Author',
                'Category',
                'ISBN',
                'Publisher',
                'Edition',
                'Publication Year',
                'Shelf Location',
                'Unit Price (KES)',
                'Total Copies',
                'Available Copies',
                'Status',
            ]);

            foreach ($books as $b) {
                fputcsv($handle, [
                    $b->title,
                    $b->author,
                    $b->category,
                    $b->isbn,
                    $b->publisher,
                    $b->edition,
                    $b->publication_year,
                    $b->location,
                    $b->price ? number_format((float) $b->price, 2, '.', '') : '0.00',
                    $b->total_copies,
                    $b->available_copies,
                    $b->is_active ? 'Active' : 'Archived',
                ]);
            }

            fclose($handle);
        }, $fileName, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ]);
    }

    /**
     * Download starter CSV import template.
     */
    public function downloadTemplate(): StreamedResponse
    {
        $fileName = 'EduFlow_Book_Import_Template.csv';

        return response()->streamDownload(function () {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF");

            // Headers
            fputcsv($handle, [
                'title',
                'author',
                'category',
                'isbn',
                'publisher',
                'edition',
                'publication_year',
                'location',
                'total_copies',
                'price',
                'description',
            ]);

            // Sample Rows for guidance
            fputcsv($handle, [
                'Fasihi ya Kiswahili: Mwongozo Kamili',
                'K. W. Wamitila',
                'Textbook',
                '978-9966-20-202',
                'Vide-Muwa Publishers',
                '2nd Edition',
                '2022',
                'Shelf A-1',
                '40',
                '850',
                'Secondary setbook guide',
            ]);
            fputcsv($handle, [
                'Secondary Mathematics Form 1',
                'KLB Authoring Team',
                'Mathematics',
                '978-9966-10-101',
                'Kenya Literature Bureau',
                '4th Edition',
                '2021',
                'Shelf B-3',
                '50',
                '950',
                'Form 1 CBC & 8-4-4 core curriculum',
            ]);
            fputcsv($handle, [
                'Principles of Biology & Life Sciences',
                'P. G. Mwitari',
                'Sciences',
                '978-9966-30-303',
                'Oxford University Press',
                '1st Edition',
                '2023',
                'Lab Shelf C',
                '35',
                '1200',
                'Biology course textbook with lab rubrics',
            ]);

            fclose($handle);
        }, $fileName, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ]);
    }

    /**
     * Process bulk CSV file upload.
     */
    public function importCsv(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240', // up to 10MB CSV
        ]);

        $sid = $this->getSchoolId();
        $file = $request->file('file');
        $path = $file->getRealPath();

        $rows = array_map(function ($row) {
            return str_getcsv($row);
        }, file($path));

        if (empty($rows) || count($rows) < 2) {
            return back()->withErrors(['file' => 'Uploaded CSV file is empty or missing data rows.']);
        }

        // Clean headers
        $rawHeaders = array_shift($rows);
        $headers = array_map(function ($h) {
            return strtolower(trim(preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $h)));
        }, $rawHeaders);

        // Required headers validation
        $titleIdx = array_search('title', $headers);
        $authorIdx = array_search('author', $headers);

        if ($titleIdx === false || $authorIdx === false) {
            return back()->withErrors([
                'file' => "Invalid CSV format. Missing required 'title' or 'author' column headers. Please download the sample template.",
            ]);
        }

        $categoryIdx = array_search('category', $headers);
        $isbnIdx = array_search('isbn', $headers);
        $pubIdx = array_search('publisher', $headers);
        $editionIdx = array_search('edition', $headers);
        $yearIdx = array_search('publication_year', $headers);
        $locationIdx = array_search('location', $headers);
        $copiesIdx = array_search('total_copies', $headers);
        $priceIdx = array_search('price', $headers);
        $descIdx = array_search('description', $headers);

        $inserted = 0;
        $updated = 0;
        $skipped = 0;

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                if (empty($row) || !isset($row[$titleIdx]) || trim($row[$titleIdx]) === '') {
                    $skipped++;
                    continue;
                }

                $title = trim($row[$titleIdx]);
                $author = trim($row[$authorIdx] ?? 'Unknown');
                $category = ($categoryIdx !== false && isset($row[$categoryIdx])) ? trim($row[$categoryIdx]) : 'General';
                $isbn = ($isbnIdx !== false && isset($row[$isbnIdx])) ? trim($row[$isbnIdx]) : null;
                $publisher = ($pubIdx !== false && isset($row[$pubIdx])) ? trim($row[$pubIdx]) : null;
                $edition = ($editionIdx !== false && isset($row[$editionIdx])) ? trim($row[$editionIdx]) : null;
                $pubYear = ($yearIdx !== false && isset($row[$yearIdx]) && is_numeric($row[$yearIdx])) ? (int) $row[$yearIdx] : null;
                $location = ($locationIdx !== false && isset($row[$locationIdx])) ? trim($row[$locationIdx]) : null;
                $copies = ($copiesIdx !== false && isset($row[$copiesIdx]) && is_numeric($row[$copiesIdx])) ? max(1, (int) $row[$copiesIdx]) : 1;
                $price = ($priceIdx !== false && isset($row[$priceIdx]) && is_numeric($row[$priceIdx])) ? (float) $row[$priceIdx] : null;
                $description = ($descIdx !== false && isset($row[$descIdx])) ? trim($row[$descIdx]) : null;

                // Match existing book by ISBN (if available) or Title + Author
                $existingBook = null;
                if (!empty($isbn)) {
                    $existingBook = Book::where('school_id', $sid)->where('isbn', $isbn)->first();
                }
                if (!$existingBook) {
                    $existingBook = Book::where('school_id', $sid)->where('title', $title)->where('author', $author)->first();
                }

                if ($existingBook) {
                    // Update copies
                    $existingBook->total_copies += $copies;
                    $existingBook->available_copies += $copies;
                    if ($category) $existingBook->category = $category;
                    if ($location) $existingBook->location = $location;
                    if ($price) $existingBook->price = $price;
                    $existingBook->save();
                    $updated++;
                } else {
                    Book::create([
                        'school_id'        => $sid,
                        'title'            => $title,
                        'author'           => $author,
                        'category'         => $category ?: 'General',
                        'isbn'             => $isbn,
                        'publisher'        => $publisher,
                        'edition'          => $edition,
                        'publication_year' => $pubYear,
                        'location'         => $location,
                        'total_copies'     => $copies,
                        'available_copies' => $copies,
                        'price'            => $price,
                        'description'      => $description,
                        'is_active'        => true,
                    ]);
                    $inserted++;
                }
            }

            DB::commit();

            return redirect()->route('school.library.index')
                ->with('success', "Batch import complete! {$inserted} new titles added, {$updated} existing book records updated with additional copies.");
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->withErrors([
                'file' => 'Import encountered an error on line execution: ' . $e->getMessage(),
            ]);
        }
    }
}