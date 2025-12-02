import { ref } from "vue";

export interface UseSearchOptions {
    url: string;
    resultsPath: string | null;
    trigger: string;
    rate: number;
}

export function useSearch(options: UseSearchOptions) {
    const { url, resultsPath, trigger, rate } = options;

    const searchResults = ref<any[]>([]);
    const loading = ref(false);
    let searchTimeout: NodeJS.Timeout | null = null;
    let lastSearchTime = 0;

    // Helper to get nested value from object using path
    function getNestedValue(obj: any, path: string): any {
        return path.split(".").reduce((current, key) => current?.[key], obj);
    }

    // Perform external API search
    async function performSearch(searchQuery: string) {
        if (!url || !searchQuery) {
            searchResults.value = [];
            return;
        }

        loading.value = true;
        try {
            // Replace {{value}} placeholder with search query
            const searchUrl = url.replace(
                /\{\{value\}\}/g,
                encodeURIComponent(searchQuery)
            );

            // Fetch from external API
            const response = await fetch(searchUrl);

            if (!response.ok) {
                throw new Error(
                    `API returned ${response.status}: ${response.statusText}`
                );
            }

            const data = await response.json();

            // Extract results from response using resultsPath
            let results = data;
            if (resultsPath) {
                results = getNestedValue(data, resultsPath);
            }

            // Ensure results is an array
            if (!Array.isArray(results)) {
                console.error("API response is not an array:", results);
                searchResults.value = [];
                return;
            }

            searchResults.value = results;
        } catch (error) {
            console.error("API search error:", error);
            searchResults.value = [];
        } finally {
            loading.value = false;
        }
    }

    // Handle search with throttle or debounce
    function handleSearch(searchQuery: string) {
        if (!searchQuery || searchQuery.length < 1) {
            searchResults.value = [];
            return;
        }

        if (trigger === "throttle") {
            // Throttle: Execute immediately if enough time has passed
            const now = Date.now();
            if (now - lastSearchTime >= rate) {
                lastSearchTime = now;
                performSearch(searchQuery);
            } else {
                // Schedule for later if within rate limit
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }
                searchTimeout = setTimeout(() => {
                    lastSearchTime = Date.now();
                    performSearch(searchQuery);
                }, rate - (now - lastSearchTime));
            }
        } else {
            // Debounce: Wait for user to stop typing
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            searchTimeout = setTimeout(async () => {
                await performSearch(searchQuery);
            }, rate);
        }
    }

    function cleanup() {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
    }

    return {
        searchResults,
        loading,
        handleSearch,
        cleanup,
    };
}

