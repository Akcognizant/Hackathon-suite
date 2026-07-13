package com.cognizant.hackathon.event;

/** Published when a new team is registered (e.g. created during CSV import). */
public record TeamRegisteredEvent(Long teamId, String teamName) {
}
