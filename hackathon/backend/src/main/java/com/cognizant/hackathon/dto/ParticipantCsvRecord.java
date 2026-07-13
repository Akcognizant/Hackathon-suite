package com.cognizant.hackathon.dto;

import com.opencsv.bean.CsvBindByName;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One row of the participant import CSV. OpenCSV binds by header name, so the
 * file's first line must contain the columns:
 * Name, Email, TeamName, HackathonName, Role.
 */
@Data
@NoArgsConstructor
public class ParticipantCsvRecord {

    @CsvBindByName(column = "Name")
    private String name;

    @CsvBindByName(column = "Email")
    private String email;

    @CsvBindByName(column = "TeamName")
    private String teamName;

    @CsvBindByName(column = "HackathonName")
    private String hackathonName;

    @CsvBindByName(column = "Role")
    private String role;
}
