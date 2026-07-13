package com.cognizant.hackathon.event;

/** Published after a hackathon is deleted. Carries the title captured pre-delete. */
public record HackathonDeletedEvent(Long hackathonId, String title) {
}
