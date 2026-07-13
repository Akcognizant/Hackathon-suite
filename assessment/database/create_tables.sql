CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Questions cover two sections in one table (polymorphic by question_type):
--   section 'pattern' → MCQ types: number_sequence | shape_pattern | matrix
--                       (use pattern_data, options, correct_option_index)
--   section 'drag'    → activity types: categorize | match | sequence | rank | fill-blank
--                       (use prompt, items, zones, answer_key, suffix)
-- answer_key is SERVER-ONLY and must never be sent to the client.
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section VARCHAR(20) NOT NULL DEFAULT 'pattern',
    question_text TEXT NOT NULL,               -- MCQ text, or activity title
    question_type VARCHAR(50) NOT NULL,
    prompt TEXT,                               -- activity instruction (null for MCQ)
    -- MCQ fields (null for activities)
    pattern_data JSONB,
    options JSONB,
    correct_option_index INT,
    -- Activity fields (null for MCQ)
    items JSONB,
    zones JSONB,
    answer_key JSONB,                          -- server-only
    suffix TEXT,                               -- fill-blank only: text after the last blank
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE assessment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id),
    attempt_number INT NOT NULL DEFAULT 1,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    total_time_seconds INT,
    final_score INT,
    max_score INT,                             -- variable per attempt (sum of item counts)
    accuracy_percentage DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'IN_PROGRESS'
);

CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES assessment_sessions(id),
    question_id UUID NOT NULL REFERENCES questions(id),
    display_order INT NOT NULL DEFAULT 0,      -- order within the attempt (section 1 then 2)
    -- MCQ answer
    selected_option_index INT,
    -- Activity answer + behavioural telemetry
    answer JSONB,                              -- {kind:'mapping',placements:{}} | {kind:'order',order:[]}
    events JSONB,                              -- raw drag event log (scored server-side)
    drag_attempts INT DEFAULT 0,
    incorrect_placements INT DEFAULT 0,
    -- scoring (per item: 1 point each)
    is_correct BOOLEAN,
    correct_count INT DEFAULT 0,
    total_count INT DEFAULT 0,
    time_taken_seconds INT,
    attempt_count INT DEFAULT 0,
    answered_at TIMESTAMP DEFAULT NOW()
);
