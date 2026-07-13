package com.cognizant.hackathon.dto;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Stable, reusable pagination envelope for admin tables. Prefer this over returning
 * Spring's {@code Page}/{@code PageImpl} directly (whose JSON shape is unstable across
 * versions and triggers a serialization warning). Use {@link #from(Page)} in any
 * controller: {@code return PageResponse.from(service.getX(..., pageable));}
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.hasNext(),
                page.hasPrevious());
    }
}
