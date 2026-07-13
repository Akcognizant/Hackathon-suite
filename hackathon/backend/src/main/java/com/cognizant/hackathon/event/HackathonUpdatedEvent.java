package com.cognizant.hackathon.event;

/** Published after a hackathon's details are updated. */
public record HackathonUpdatedEvent(Long hackathonId, String title) {
}
