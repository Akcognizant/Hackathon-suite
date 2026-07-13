// StartSessionRequest.java
package com.assessment.backend.dto.sessions;

import lombok.Data;
import java.util.UUID;

@Data
public class StartSessionRequest {
    private UUID candidateId;
}