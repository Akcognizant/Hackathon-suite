package com.cognizant.hackathon.event;

/** Published after a hackathon is created. */
public record HackathonCreatedEvent(Long hackathonId, String title) {
}
