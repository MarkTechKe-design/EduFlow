<script setup>
import { ref } from 'vue';

const props = defineProps({
    selectedStudentIds: {
        type: Array,
        default: () => []
    },
    activeClassId: {
        type: [Number, String],
        default: null
    },
    activeSectionId: {
        type: [Number, String],
        default: null
    }
});

const selectedTemplate = ref('executive');

const triggerBulk = (exportType = null) => {
    const params = new URLSearchParams();
    params.append('template', selectedTemplate.value);

    if (props.selectedStudentIds.length > 0) {
        params.append('student_ids', props.selectedStudentIds.join(','));
    } else if (props.activeSectionId) {
        params.append('section_id', props.activeSectionId);
    } else if (props.activeClassId) {
        params.append('class_id', props.activeClassId);
    }

    if (exportType) {
        params.append('export', exportType);
    }

    const targetUrl = `/school/reports/cbc/bulk?${params.toString()}`;
    window.open(targetUrl, '_blank');
};
</script>

<template>
    <div class="flex flex-wrap items-center gap-2 bg-slate-900 text-white p-3 rounded-lg border border-slate-700 shadow-md">
        <!-- Status Indicator -->
        <div class="flex items-center gap-2 pr-3 border-r border-slate-700 text-xs font-semibold">
            <span class="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span v-if="selectedStudentIds.length > 0">
                {{ selectedStudentIds.length }} Selected
            </span>
            <span v-else class="text-slate-400">
                Whole Class Mode
            </span>
        </div>

        <!-- Template Selector -->
        <div class="flex items-center gap-1.5 text-xs">
            <label class="text-slate-300 font-medium">Template:</label>
            <select
                v-model="selectedTemplate"
                class="bg-slate-800 text-slate-100 text-xs rounded border border-slate-600 px-2 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
                <option value="executive">Executive CBE (Emerald Standard)</option>
                <option value="transcript">Transcript (With Analytics Chart)</option>
            </select>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 ml-auto">
            <!-- In-Browser Batch Print -->
            <button
                type="button"
                @click="triggerBulk(null)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded shadow transition"
            >
                <span>🖨</span>
                <span>Print Reports</span>
            </button>

            <!-- Combined PDF -->
            <button
                type="button"
                @click="triggerBulk('pdf_combined')"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded shadow transition"
            >
                <span>📄</span>
                <span>Combined PDF</span>
            </button>

            <!-- Zipped Archive -->
            <button
                type="button"
                @click="triggerBulk('zip')"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded shadow transition"
            >
                <span>📦</span>
                <span>Download ZIP</span>
            </button>
        </div>
    </div>
</template>