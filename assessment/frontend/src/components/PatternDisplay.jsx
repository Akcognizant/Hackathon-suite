// Shared renderer for the three pattern-MCQ visuals (number sequence, shape
// pattern, matrix). Used both while taking the assessment (AssessmentPage) and
// when reviewing answers afterwards (ResultPage). Purely presentational — it
// takes a { type, pattern_data } shape and draws the prompt visual.

function NumberSequence({ data }) {
    return (
        <div className="flex items-center justify-center gap-2 flex-wrap">
            {data.sequence.map((item, i) => {
                const isQuestion = item === '?'
                return (
                    <div key={i} className="flex items-center gap-2">
                        <div
                            className={[
                                'w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-medium font-mono',
                                isQuestion
                                    ? 'border-2 border-dashed text-purple-400'
                                    : 'bg-white border border-gray-100 text-gray-800 shadow-sm',
                            ].join(' ')}
                            style={isQuestion ? { borderColor: '#534AB7', color: '#534AB7', backgroundColor: '#EEEDFE' } : {}}
                        >
                            {item}
                        </div>
                        {i < data.sequence.length - 1 && (
                            <span className="text-gray-300 text-sm">→</span>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function ShapePattern({ data }) {
    return (
        <div className="flex items-center justify-center gap-3 flex-wrap">
            {data.sequence.map((item, i) => {
                const isQuestion = item.count === 0
                return (
                    <div key={i} className="flex items-center gap-3">
                        <div
                            className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1"
                            style={
                                isQuestion
                                    ? { border: '2px dashed #534AB7', backgroundColor: '#EEEDFE' }
                                    : { backgroundColor: '#fff', border: '1px solid #f0f0f0' }
                            }
                        >
                            {isQuestion ? (
                                <span className="text-2xl font-medium" style={{ color: '#534AB7' }}>?</span>
                            ) : (
                                <>
                                    <span className="text-base leading-tight" style={{ color: '#26215C' }}>
                                        {Array(item.count).fill(item.shape).join(' ')}
                                    </span>
                                    <span className="text-xs font-mono text-gray-400">×{item.count}</span>
                                </>
                            )}
                        </div>
                        {i < data.sequence.length - 1 && (
                            <span className="text-gray-300 text-sm">→</span>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function MatrixPattern({ data }) {
    return (
        <div className="flex justify-center">
            <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${data.grid[0].length}, 1fr)` }}>
                {data.grid.flat().map((cell, i) => {
                    const isQuestion = cell === '?'
                    return (
                        <div
                            key={i}
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-medium font-mono"
                            style={
                                isQuestion
                                    ? { border: '2px dashed #534AB7', backgroundColor: '#EEEDFE', color: '#534AB7' }
                                    : { backgroundColor: '#fff', border: '1px solid #f0f0f0', color: '#1a1a2e' }
                            }
                        >
                            {cell}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default function PatternDisplay({ question }) {
    if (!question?.pattern_data) return null
    if (question.type === 'number_sequence') return <NumberSequence data={question.pattern_data} />
    if (question.type === 'shape_pattern') return <ShapePattern data={question.pattern_data} />
    if (question.type === 'matrix') return <MatrixPattern data={question.pattern_data} />
    return null
}
