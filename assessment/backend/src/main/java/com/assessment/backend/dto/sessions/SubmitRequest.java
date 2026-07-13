// SubmitRequest.java
package com.assessment.backend.dto.sessions;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class SubmitRequest {
    private UUID candidateId;
    private Integer totalTimeSeconds;
    private List<ResponseDto> responses;
}