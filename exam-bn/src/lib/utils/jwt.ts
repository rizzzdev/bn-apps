/**
 * Helper ringan untuk mengekstrak payload JWT secara in-memory
 * tanpa bergantung pada panggilan HTTP API eksternal.
 */
export interface JwtUserPayload {
	id?: string;
	sub?: string;
	userId?: string;
	fullname?: string;
	name?: string;
	email?: string | null;
	role?: string;
	roles?: string[];
	exp?: number;
	iat?: number;
	[key: string]: unknown;
}

export function parseJwtPayload(token: string): JwtUserPayload | null {
	if (!token || typeof token !== 'string') return null;
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		
		// Handling base64url format
		let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		while (base64.length % 4) {
			base64 += '=';
		}

		const jsonPayload =
			typeof Buffer !== 'undefined'
				? Buffer.from(base64, 'base64').toString('utf-8')
				: atob(base64);

		return JSON.parse(jsonPayload) as JwtUserPayload;
	} catch {
		return null;
	}
}

export function isJwtExpired(payload: JwtUserPayload): boolean {
	if (!payload.exp) return false;
	const nowSeconds = Math.floor(Date.now() / 1000);
	return payload.exp <= nowSeconds;
}
