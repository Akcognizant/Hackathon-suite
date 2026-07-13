// StartSessionResponse.java
package com.assessment.backend.dto.sessions;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.UUID;

@Data
@AllArgsConstructor
public class StartSessionResponse {
    private UUID sessionId;
    private Integer attemptNumber;
}