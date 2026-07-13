package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.RubricCriterionDto;
import com.cognizant.hackathon.entity.Hackathon;
import com.cognizant.hackathon.entity.RubricCriterion;
import com.cognizant.hackathon.exception.ResourceNotFoundException;
import com.cognizant.hackathon.repository.HackathonRepository;
import com.cognizant.hackathon.repository.RubricCriterionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RubricService {

    private final RubricCriterionRepository rubricCriterionRepository;
    private final HackathonRepository hackathonRepository;

    @Transactional(readOnly = true)
    public List<RubricCriterionDto> getRubricForHackathon(Long hackathonId) {
        if (!hackathonRepository.existsById(hackathonId)) {
            throw new ResourceNotFoundException("Hackathon not found with id: " + hackathonId);
        }

        return rubricCriterionRepository.findByHackathonId(hackathonId).stream()
                .map(c -> new RubricCriterionDto(c.getName(), c.getMaxPoints()))
                .toList();
    }

    /**
     * Replaces a hackathon's full set of evaluation criteria (delete + insert),
     * after validating the hackathon exists and every criterion is well-formed.
     */
    @Transactional
    public List<RubricCriterionDto> replaceCriteria(Long hackathonId, List<RubricCriterionDto> criteria) {
        Hackathon hackathon = hackathonRepository.findById(hackathonId)
                .orElseThrow(() -> new ResourceNotFoundException("Hackathon not found with id: " + hackathonId));

        if (criteria == null || criteria.isEmpty()) {
            throw new IllegalArgumentException("At least one evaluation criterion is required");
        }

        // Validate AND build the full set first, so a single bad row never reaches
        // the destructive delete below and wipes the existing criteria. Names are
        // trimmed once here and reused for both validation and persistence.
        List<RubricCriterion> toSave = new ArrayList<>(criteria.size());
        for (int i = 0; i < criteria.size(); i++) {
            RubricCriterionDto c = criteria.get(i);
            String name = c.name() == null ? "" : c.name().trim();
            if (name.isEmpty()) {
                throw new IllegalArgumentException("Criterion #" + (i + 1) + " is missing a name");
            }
            if (c.max() <= 0) {
                throw new IllegalArgumentException(
                        "Criterion '" + name + "' must have a max score greater than 0");
            }
            toSave.add(RubricCriterion.builder()
                    .name(name)
                    .maxPoints(c.max())
                    .hackathon(hackathon)
                    .build());
        }

        rubricCriterionRepository.deleteByHackathonId(hackathonId);
        rubricCriterionRepository.saveAll(toSave);

        return getRubricForHackathon(hackathonId);
    }
}
