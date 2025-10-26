// API helper functions
export async function generateAIInventoryReport(): Promise<any> {
	const base = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000';
	const url = `${base.replace(/\/+$/, '')}/inventory/ai-report`;

	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({}),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}

	return res.json();
}

	// Similar to generateAIInventoryReport but returns a blob and a filename to trigger download.
	export async function generateAIInventoryReportFile(): Promise<{ blob: Blob; filename: string }> {
		const base = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000';
		const url = `${base.replace(/\/+$/, '')}/inventory/ai-report`;

		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(text || `HTTP ${res.status}`);
		}

		// Try to get filename from Content-Disposition header
		let filename = 'report';
		const disposition = res.headers.get('Content-Disposition') || '';
		const filenameMatch = /filename\*=UTF-8''([^;\n]+)/i.exec(disposition) || /filename="?([^;\n"]+)"?/i.exec(disposition);
		if (filenameMatch && filenameMatch[1]) {
			try {
				filename = decodeURIComponent(filenameMatch[1].replace(/"/g, ''));
			} catch {
				filename = filenameMatch[1].replace(/"/g, '');
			}
		}

		// Default extension if none
		const blob = await res.blob();
		if (!/\./.test(filename)) {
			// try to infer type
			const type = blob.type || '';
			if (type.includes('json')) filename = `${filename}.json`;
			else if (type.includes('pdf')) filename = `${filename}.pdf`;
			else if (type) filename = `${filename}`;
			else filename = `${filename}.bin`;
		}

		return { blob, filename };
	}

