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
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

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
                       ->orWhere('isbn', 'like', "%{$search}%");
                });
            })
            ->when($request->category && $request->category !== 'all', fn ($q) => $q->where('category', $request->category))
            ->orderBy('title')
            ->paginate(15, ['*'], 'books_page')
            ->withQueryString();

        $issues = BookIssue::with(['book:id,title,author,isbn,location'])
            ->where('school_id', $sid)
            ->when($request->status && $request->status !== 'all', fn ($q) => $q->where('status', $request->status))
            ->latest('issued_date')
            ->paginate(15, ['*'], 'issues_page')
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

        return redirect('/school/library/books')
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

        $book->update($validated);

        return redirect('/school/library/books')
            ->with('success', 'Book updated successfully.');
    }

    public function destroyBook(Book $book): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $book->school_id === $sid, 404);

        $book->delete();

        return redirect('/school/library/books')
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

        return redirect('/school/library/books')
            ->with('success', "Book '{$book->title}' issued successfully.");
    }

    public function returnBook(Request $request, BookIssue $issue): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $issue->school_id === $sid, 404);

        $returnDate = $request->input('returned_date', now()->toDateString());
        $issue->update([
            'status'        => 'returned',
            'returned_date' => $returnDate,
        ]);

        if ($issue->book) {
            $issue->book->increment('available_copies');
        }

        return redirect('/school/library/books')
            ->with('success', 'Book marked as returned.');
    }

    public function markLost(Request $request, BookIssue $issue): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $issue->school_id === $sid, 404);

        $fineAmount = $request->input('fine_amount', 0);
        $issue->update([
            'status'      => 'lost',
            'fine'        => $fineAmount,
            'fine_amount' => $fineAmount,
            'fine_status' => 'unpaid',
        ]);

        return redirect('/school/library/books')
            ->with('success', 'Book marked as lost.');
    }

    public function clearFine(Request $request, BookIssue $issue): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $issue->school_id === $sid, 404);

        $issue->update([
            'fine_status'  => 'paid',
            'fine_paid_at' => now(),
        ]);

        return redirect('/school/library/books')
            ->with('success', 'Fine cleared.');
    }

    public function checkStudentClearance(Student $student): JsonResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $student->school_id === $sid, 404);

        $activeIssues = BookIssue::where('school_id', $sid)
            ->where('member_type', Student::class)
            ->where('member_id', $student->id)
            ->where('status', 'issued')
            ->count();

        return response()->json([
            'cleared'       => $activeIssues === 0,
            'active_issues' => $activeIssues,
        ]);
    }
}