// Build visible Review Mode rows from grouped entries and expansion state
//
// (c) Copyright 2026 Liminal HQ, Scott Morris
// SPDX-License-Identifier: MIT

import type { ReviewGroup, ReviewVisibleRow } from './types.js';

export const buildVisibleReviewRows = (
	groups: ReviewGroup[],
	expandedGroups: Record<string, boolean>,
): ReviewVisibleRow[] => {
	if (groups.length === 0) return [];

	if (groups.length === 1 && groups[0].key === '__all__') {
		return groups[0].entries.map((entry) => ({ kind: 'entry', entry }));
	}

	const rows: ReviewVisibleRow[] = [];
	for (const group of groups) {
		rows.push({ kind: 'group', group });
		const expanded = expandedGroups[group.key] ?? true;
		if (!expanded) continue;
		for (const entry of group.entries) {
			rows.push({ kind: 'entry', groupKey: group.key, entry });
		}
	}

	return rows;
};
