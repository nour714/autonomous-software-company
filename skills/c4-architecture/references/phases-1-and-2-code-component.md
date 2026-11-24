# C4 Documentation: Phases 1 & 2 (Code and Component Level)

## Phase 1: Code-Level Documentation (Bottom-Up Analysis)

### 1.1 Discover All Subdirectories

- Use codebase search to identify all subdirectories in the repository
- Sort directories by depth (deepest first) for bottom-up processing
- Filter out common non-code directories (node_modules, .git, build, dist, etc.)
- Create list of directories to process

### 1.2 Process Each Directory (Bottom-Up)

For each directory, starting from the deepest:

- Role: `c4-code`
- Prompt: |
  Analyze the code in directory: [directory_path]

  Create comprehensive C4 Code-level documentation following this structure:
  1. **Overview Section**:
     - Name: [Descriptive name for this code directory]
     - Description: [Short description of what this code does]
     - Location: [Link to actual directory path relative to repo root]
     - Language: [Primary programming language(s) used]
     - Purpose: [What this code accomplishes]
  2. **Code Elements Section**:
     - Document all functions/methods with complete signatures:
       - Function name, parameters (with types), return type
       - Description of what each function does
       - Location (file path and line numbers)
       - Dependencies (what this function depends on)
     - Document all classes/modules:
       - Class name, description, location
       - Methods and their signatures
       - Dependencies
  3. **Dependencies Section**:
     - Internal dependencies (other code in this repo)
     - External dependencies (libraries, frameworks, services)
  4. **Relationships Section**:
     - Optional Mermaid diagram if relationships are complex

  Save the output as: C4-Documentation/c4-code-[directory-name].md
  Use a sanitized directory name (replace / with -, remove special chars) for the filename.

  Ensure the documentation includes:
  - Complete function signatures with all parameters and types
  - Links to actual source code locations
  - All dependencies (internal and external)
  - Clear, descriptive names and descriptions

- Expected output: c4-code-<directory-name>.md file in C4-Documentation/
- Context: All files in the directory and its subdirectories

**Repeat for every subdirectory** until all directories have corresponding c4-code-\*.md files.

## Phase 2: Component-Level Synthesis

### 2.1 Analyze All Code-Level Documentation

- Collect all c4-code-\*.md files created in Phase 1
- Analyze code structure, dependencies, and relationships
- Identify logical component boundaries based on:
  - Domain boundaries (related business functionality)
  - Technical boundaries (shared frameworks, libraries)
  - Organizational boundaries (team ownership, if evident)

### 2.2 Create Component Documentation

For each identified component:

- Role: `c4-component`
- Prompt: |
  Synthesize the following C4 Code-level documentation files into a logical component:

  Code files to analyze:
  [List of c4-code-*.md file paths]

  Create comprehensive C4 Component-level documentation following this structure:
  1. **Overview Section**:
     - Name: [Component name - descriptive and meaningful]
     - Description: [Short description of component purpose]
     - Type: [Application, Service, Library, etc.]
     - Technology: [Primary technologies used]
  2. **Purpose Section**:
     - Detailed description of what this component does
     - What problems it solves
     - Its role in the system
  3. **Software Features Section**:
     - List all software features provided by this component
     - Each feature with a brief description
  4. **Code Elements Section**:
     - List all c4-code-\*.md files contained in this component
     - Link to each file with a brief description
  5. **Interfaces Section**:
     - Document all component interfaces:
       - Interface name
       - Protocol (REST, GraphQL, gRPC, Events, etc.)
       - Description
       - Operations (function signatures, endpoints, etc.)
  6. **Dependencies Section**:
     - Components used (other components this depends on)
     - External systems (databases, APIs, services)
  7. **Component Diagram**:
     - Mermaid diagram showing this component and its relationships

  Save the output as: C4-Documentation/c4-component-[component-name].md
  Use a sanitized component name for the filename.

- Expected output: c4-component-<name>.md file for each component
- Context: All relevant c4-code-\*.md files for this component

### 2.3 Create Master Component Index

- Role: `c4-component`
- Prompt: |
  Create a master component index that lists all components in the system.

  Based on all c4-component-\*.md files created, generate:
  1. **System Components Section**:
     - List all components with:
       - Component name
       - Short description
       - Link to component documentation
  2. **Component Relationships Diagram**:
     - Mermaid diagram showing all components and their relationships
     - Show dependencies between components
     - Show external system dependencies

  Save the output as: C4-Documentation/c4-component.md

- Expected output: Master c4-component.md file
- Context: All c4-component-\*.md files

