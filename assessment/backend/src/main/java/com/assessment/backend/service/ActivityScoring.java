package com.assessment.backend.service;

import com.assessment.backend.model.Question;

import java.util.List;
import java.util.Map;

/**
 * Server-side grading for drag activities. One point per correctly-placed item.
 * Reads the JSONB answer/answerKey/events (already deserialised by Hibernate into
 * Map/List). Ported from the DragAndDrop ScoringService; accuracy% and the
 * drag-efficiency penalty are dropped — dragAttempts/incorrectPlacements are kept
 * as analytics-only telemetry.
 */
final class ActivityScoring {

    private ActivityScoring() {}

    /** @return [correctCount, totalCount, incorrectPlacements] */
    @SuppressWarnings("unchecked")
    static int[] score(Question q, Object answerObj, Object eventsObj) {
        Object key = q.getAnswerKey();
        Map<String, Object> answer = answerObj instanceof Map ? (Map<String, Object>) answerObj : Map.of();
        List<Object> events = eventsObj instanceof List ? (List<Object>) eventsObj : List.of();
        String kind = str(answer.get("kind"));

        int correct = 0, total = 0, incorrect = 0;

        if ("mapping".equals(kind) && key instanceof Map) {
            Map<String, String> keyMap = (Map<String, String>) key;
            Map<String, String> placements = answer.get("placements") instanceof Map
                    ? (Map<String, String>) answer.get("placements") : Map.of();
            total = keyMap.size();
            for (Map.Entry<String, String> e : keyMap.entrySet()) {
                String placed = placements.get(e.getKey());
                if (placed != null && placed.equals(e.getValue())) correct++;
            }
            for (Object evO : events) {
                if (!(evO instanceof Map)) continue;
                Map<String, Object> ev = (Map<String, Object>) evO;
                String type = str(ev.get("type"));
                String zoneId = str(ev.get("zoneId"));
                String itemId = str(ev.get("itemId"));
                if (("place".equals(type) || "move".equals(type))
                        && zoneId != null && !zoneId.equals(keyMap.get(itemId))) {
                    incorrect++;
                }
            }
        } else if ("order".equals(kind) && key instanceof List) {
            List<String> keyList = (List<String>) key;
            List<String> order = answer.get("order") instanceof List
                    ? (List<String>) answer.get("order") : List.of();
            total = keyList.size();
            for (int i = 0; i < keyList.size(); i++) {
                if (i < order.size() && keyList.get(i).equals(order.get(i))) correct++;
            }
            for (Object evO : events) {
                if (!(evO instanceof Map)) continue;
                Map<String, Object> ev = (Map<String, Object>) evO;
                if ("reorder".equals(str(ev.get("type"))) && ev.get("toIndex") != null) {
                    int idx = ((Number) ev.get("toIndex")).intValue();
                    String itemId = str(ev.get("itemId"));
                    if (idx < 0 || idx >= keyList.size() || !keyList.get(idx).equals(itemId)) incorrect++;
                }
            }
        } else {
            // Unanswered / unknown → total from the key so it still counts against maxScore.
            if (key instanceof Map) total = ((Map<?, ?>) key).size();
            else if (key instanceof List) total = ((List<?>) key).size();
        }

        return new int[]{correct, total, incorrect};
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }
}
