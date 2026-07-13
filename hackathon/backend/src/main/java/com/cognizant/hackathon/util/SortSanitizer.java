package com.cognizant.hackathon.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Set;

/**
 * Guards Spring Data sorting against arbitrary/unknown properties. A client that
 * sends {@code ?sort=someUnknownField} would otherwise trigger a
 * {@code PropertyReferenceException} (HTTP 500). Each module declares its own
 * {@code ALLOWED_SORT_FIELDS} whitelist and a safe fallback.
 *
 * <p>Usage in a service:
 * <pre>{@code
 * private static final Set<String> ALLOWED = Set.of("id", "title", "startDate");
 * private static final Sort FALLBACK = Sort.by(Sort.Direction.DESC, "startDate");
 * ...
 * Pageable safe = SortSanitizer.sanitize(pageable, ALLOWED, FALLBACK);
 * }</pre>
 */
public final class SortSanitizer {

    private SortSanitizer() {
    }

    /** Drop any order whose property isn't whitelisted; if nothing valid remains, use the fallback. */
    public static Sort sanitize(Sort requested, Set<String> allowed, Sort fallback) {
        if (requested == null || requested.isUnsorted()) {
            return fallback;
        }
        List<Sort.Order> safe = requested.stream()
                .filter(order -> allowed.contains(order.getProperty()))
                .toList();
        return safe.isEmpty() ? fallback : Sort.by(safe);
    }

    /** Same as {@link #sanitize(Sort, Set, Sort)} but preserves page number/size. */
    public static Pageable sanitize(Pageable pageable, Set<String> allowed, Sort fallback) {
        Sort safeSort = sanitize(pageable.getSort(), allowed, fallback);
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), safeSort);
    }
}
