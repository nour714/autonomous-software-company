# Determinism, State Management, Resilience & Best Practices

## State Management and Determinism

### Automatic State Preservation

**How Temporal Works** (Source: docs.temporal.io/workflows):

- Complete program state preserved automatically
- Event History records every command and event
- Seamless recovery from crashes
- Applications restore pre-failure state

### Determinism Constraints

**Workflows Execute as State Machines**:

- Replay behavior must be consistent
- Same inputs → identical outputs every time

**Prohibited in Workflows** (Source: docs.temporal.io/workflows):

- ❌ Threading, locks, synchronization primitives
- ❌ Random number generation (`random()`)
- ❌ Global state or static variables
- ❌ System time (`datetime.now()`)
- ❌ Direct file I/O or network calls
- ❌ Non-deterministic libraries

**Allowed in Workflows**:

- ✅ `workflow.now()` (deterministic time)
- ✅ `workflow.random()` (deterministic random)
- ✅ Pure functions and calculations
- ✅ Calling activities (non-deterministic operations)

### Versioning Strategies

**Challenge**: Changing workflow code while old executions still running

**Solutions**:

1. **Versioning API**: Use `workflow.get_version()` for safe changes
2. **New Workflow Type**: Create new workflow, route new executions to it
3. **Backward Compatibility**: Ensure old events replay correctly

## Resilience and Error Handling

### Retry Policies

**Default Behavior**: Temporal retries activities forever

**Configure Retry**:

- Initial retry interval
- Backoff coefficient (exponential backoff)
- Maximum interval (cap retry delay)
- Maximum attempts (eventually fail)

**Non-Retryable Errors**:

- Invalid input (validation failures)
- Business rule violations
- Permanent failures (resource not found)

### Idempotency Requirements

**Why Critical** (Source: docs.temporal.io/activities):

- Activities may execute multiple times
- Network failures trigger retries
- Duplicate execution must be safe

**Implementation Strategies**:

- Idempotency keys (deduplication)
- Check-then-act with unique constraints
- Upsert operations instead of insert
- Track processed request IDs

### Activity Heartbeats

**Purpose**: Detect stalled long-running activities

**Pattern**:

- Activity sends periodic heartbeat
- Includes progress information
- Timeout if no heartbeat received
- Enables progress-based retry

## Best Practices

### Workflow Design

1. **Keep workflows focused** - Single responsibility per workflow
2. **Small workflows** - Use child workflows for scalability
3. **Clear boundaries** - Workflow orchestrates, activities execute
4. **Test locally** - Use time-skipping test environment

### Activity Design

1. **Idempotent operations** - Safe to retry
2. **Short-lived** - Seconds to minutes, not hours
3. **Timeout configuration** - Always set timeouts
4. **Heartbeat for long tasks** - Report progress
5. **Error handling** - Distinguish retryable vs non-retryable

### Common Pitfalls

**Workflow Violations**:

- Using `datetime.now()` instead of `workflow.now()`
- Threading or async operations in workflow code
- Calling external APIs directly from workflow
- Non-deterministic logic in workflows

**Activity Mistakes**:

- Non-idempotent operations (can't handle retries)
- Missing timeouts (activities run forever)
- No error classification (retry validation errors)
- Ignoring payload limits (2MB per argument)

### Operational Considerations

**Monitoring**:

- Workflow execution duration
- Activity failure rates
- Retry attempts and backoff
- Pending workflow counts

**Scalability**:

- Horizontal scaling with workers
- Task queue partitioning
- Child workflow decomposition
- Activity batching when appropriate

## Additional Resources

**Official Documentation**:

- Temporal Core Concepts: docs.temporal.io/workflows
- Workflow Patterns: docs.temporal.io/evaluate/use-cases-design-patterns
- Best Practices: docs.temporal.io/develop/best-practices
- Saga Pattern: temporal.io/blog/saga-pattern-made-easy

**Key Principles**:

1. Workflows = orchestration, Activities = external calls
2. Determinism is non-negotiable for workflows
3. Idempotency is critical for activities
4. State preservation is automatic
5. Design for failure and recovery
