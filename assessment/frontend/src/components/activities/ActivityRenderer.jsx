// src/components/activities/ActivityRenderer.jsx
//
// Switches on activity.type and renders the matching activity component, forwarding the
// runner's ref (to pull the final answer) plus the callbacks that drive completeness
// gating (onProgress) and telemetry (onDragAttempt / onEvent).

import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import CategorizeActivity from './CategorizeActivity';
import MatchActivity from './MatchActivity';
import SequenceActivity from './SequenceActivity';
import RankActivity from './RankActivity';
import FillBlankActivity from './FillBlankActivity';

const COMPONENTS = {
  categorize: CategorizeActivity,
  match: MatchActivity,
  sequence: SequenceActivity,
  rank: RankActivity,
  'fill-blank': FillBlankActivity,
};

const ActivityRenderer = forwardRef(function ActivityRenderer(
  { activity, initialAnswer, onProgress, onDragAttempt, onEvent },
  ref,
) {
  const Component = COMPONENTS[activity.type];
  if (!Component) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Unsupported activity type: <code>{activity.type}</code>
      </div>
    );
  }
  return (
    <Component
      ref={ref}
      activity={activity}
      initialAnswer={initialAnswer}
      onProgress={onProgress}
      onDragAttempt={onDragAttempt}
      onEvent={onEvent}
    />
  );
});

ActivityRenderer.propTypes = {
  activity: PropTypes.shape({
    type: PropTypes.oneOf(['categorize', 'match', 'sequence', 'rank', 'fill-blank']).isRequired,
  }).isRequired,
  onProgress: PropTypes.func,
  onDragAttempt: PropTypes.func,
  onEvent: PropTypes.func,
};

export default ActivityRenderer;
