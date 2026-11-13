# C4 Documentation: Configuration, Output Structure & Examples

## Configuration Options

- `target_directory`: Root directory to analyze (default: current repository root)
- `exclude_patterns`: Patterns to exclude (default: node_modules, .git, build, dist, etc.)
- `output_directory`: Where to write C4 documentation (default: C4-Documentation/)
- `include_tests`: Whether to analyze test files for context (default: true)
- `api_format`: Format for API specs (default: openapi)

## Success Criteria

- ✅ Every subdirectory has a corresponding c4-code-\*.md file
- ✅ All code-level documentation includes complete function signatures
- ✅ Components are logically grouped with clear boundaries
- ✅ All components have interface documentation
- ✅ Master component index created with relationship diagram
- ✅ Containers map to actual deployment units
- ✅ All container APIs documented with OpenAPI/Swagger specs
- ✅ Container diagram shows deployment architecture
- ✅ System context includes all personas (human and programmatic)
- ✅ User journeys documented for all key features
- ✅ All external systems and dependencies identified
- ✅ Context diagram shows system, users, and external systems
- ✅ Documentation is organized in C4-Documentation/ directory

## Output Structure

```
C4-Documentation/
├── c4-code-*.md              # Code-level docs (one per directory)
├── c4-component-*.md          # Component-level docs (one per component)
├── c4-component.md            # Master component index
├── c4-container.md            # Container-level docs
├── c4-context.md              # Context-level docs
└── apis/                      # API specifications
    ├── [container]-api.yaml   # OpenAPI specs for each container
    └── ...
```

## Coordination Notes

- **Bottom-up processing**: Process directories from deepest to shallowest
- **Incremental synthesis**: Each level builds on the previous level's documentation
- **Complete coverage**: Every directory must have code-level documentation before synthesis
- **Link consistency**: All documentation files link to each other appropriately
- **API documentation**: Container APIs must have OpenAPI/Swagger specifications
- **Stakeholder-friendly**: Context documentation should be understandable by non-technical stakeholders
- **Mermaid diagrams**: Use proper C4 Mermaid notation for all diagrams

## Example Usage

```bash
/c4-architecture:c4-architecture
```

This will:

1. Walk through all subdirectories bottom-up
2. Create c4-code-\*.md for each directory
3. Synthesize into components
4. Map to containers with API docs
5. Create system context with personas and journeys

All documentation written to: C4-Documentation/
