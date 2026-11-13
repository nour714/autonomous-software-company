# C4 Documentation: Phases 3 & 4 (Container and Context Level)

## Phase 3: Container-Level Synthesis

### 3.1 Analyze Components and Deployment Definitions

- Review all c4-component-\*.md files
- Search for deployment/infrastructure definitions:
  - Dockerfiles
  - Kubernetes manifests (deployments, services, etc.)
  - Docker Compose files
  - Terraform/CloudFormation configs
  - Cloud service definitions (AWS Lambda, Azure Functions, etc.)
  - CI/CD pipeline definitions

### 3.2 Map Components to Containers

- Role: `c4-container`
- Prompt: |
  Synthesize components into containers based on deployment definitions.

  Component documentation:
  [List of all c4-component-*.md file paths]

  Deployment definitions found:
  [List of deployment config files: Dockerfiles, K8s manifests, etc.]

  Create comprehensive C4 Container-level documentation following this structure:
  1. **Containers Section** (for each container):
     - Name: [Container name]
     - Description: [Short description of container purpose and deployment]
     - Type: [Web Application, API, Database, Message Queue, etc.]
     - Technology: [Primary technologies: Node.js, Python, PostgreSQL, etc.]
     - Deployment: [Docker, Kubernetes, Cloud Service, etc.]
  2. **Purpose Section** (for each container):
     - Detailed description of what this container does
     - How it's deployed
     - Its role in the system
  3. **Components Section** (for each container):
     - List all components deployed in this container
     - Link to component documentation
  4. **Interfaces Section** (for each container):
     - Document all container APIs and interfaces:
       - API/Interface name
       - Protocol (REST, GraphQL, gRPC, Events, etc.)
       - Description
       - Link to OpenAPI/Swagger/API Spec file
       - List of endpoints/operations
  5. **API Specifications**:
     - For each container API, create an OpenAPI 3.1+ specification
     - Save as: C4-Documentation/apis/[container-name]-api.yaml
     - Include:
       - All endpoints with methods (GET, POST, etc.)
       - Request/response schemas
       - Authentication requirements
       - Error responses
  6. **Dependencies Section** (for each container):
     - Containers used (other containers this depends on)
     - External systems (databases, third-party APIs, etc.)
     - Communication protocols
  7. **Infrastructure Section** (for each container):
     - Link to deployment config (Dockerfile, K8s manifest, etc.)
     - Scaling strategy
     - Resource requirements (CPU, memory, storage)
  8. **Container Diagram**:
     - Mermaid diagram showing all containers and their relationships
     - Show communication protocols
     - Show external system dependencies

  Save the output as: C4-Documentation/c4-container.md

- Expected output: c4-container.md with all containers and API specifications
- Context: All component documentation and deployment definitions

## Phase 4: Context-Level Documentation

### 4.1 Analyze System Documentation

- Review container and component documentation
- Search for system documentation:
  - README files
  - Architecture documentation
  - Requirements documents
  - Design documents
  - Test files (to understand system behavior)
  - API documentation
  - User documentation

### 4.2 Create Context Documentation

- Role: `c4-context`
- Prompt: |
  Create comprehensive C4 Context-level documentation for the system.

  Container documentation: C4-Documentation/c4-container.md
  Component documentation: C4-Documentation/c4-component.md
  System documentation: [List of README, architecture docs, requirements, etc.]
  Test files: [List of test files that show system behavior]

  Create comprehensive C4 Context-level documentation following this structure:
  1. **System Overview Section**:
     - Short Description: [One-sentence description of what the system does]
     - Long Description: [Detailed description of system purpose, capabilities, problems solved]
  2. **Personas Section**:
     - For each persona (human users and programmatic "users"):
       - Persona name
       - Type (Human User / Programmatic User / External System)
       - Description (who they are, what they need)
       - Goals (what they want to achieve)
       - Key features used
  3. **System Features Section**:
     - For each high-level feature:
       - Feature name
       - Description (what this feature does)
       - Users (which personas use this feature)
       - Link to user journey map
  4. **User Journeys Section**:
     - For each key feature and persona:
       - Journey name: [Feature Name] - [Persona Name] Journey
       - Step-by-step journey:
         1. [Step 1]: [Description]
         2. [Step 2]: [Description]
            ...
       - Include all system touchpoints
     - For programmatic users (external systems, APIs):
       - Integration journey with step-by-step process
  5. **External Systems and Dependencies Section**:
     - For each external system:
       - System name
       - Type (Database, API, Service, Message Queue, etc.)
       - Description (what it provides)
       - Integration type (API, Events, File Transfer, etc.)
       - Purpose (why the system depends on this)
  6. **System Context Diagram**:
     - Mermaid C4Context diagram showing:
       - The system (as a box in the center)
       - All personas (users) around it
       - All external systems around it
       - Relationships and data flows
       - Use C4Context notation for proper C4 diagram
  7. **Related Documentation Section**:
     - Links to container documentation
     - Links to component documentation

  Save the output as: C4-Documentation/c4-context.md

  Ensure the documentation is:
  - Understandable by non-technical stakeholders
  - Focuses on system purpose, users, and external relationships
  - Includes comprehensive user journey maps
  - Identifies all external systems and dependencies

- Expected output: c4-context.md with complete system context
- Context: All container, component, and system documentation

