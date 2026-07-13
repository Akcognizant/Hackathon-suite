package com.cognizant.hackathon.event;

/** Published after a participant CSV import commits. */
public record ParticipantsImportedEvent(int processed, int created, int updated) {
}
