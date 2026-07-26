# System Design Curriculum

This is the canonical table of contents for the four independent System Design
courses. The hierarchy is **course → part → chapter → topics**.

# 1. System Design for Beginners

## Part I — Foundations

### Introduction to System Design

- What system design means
- Why system design matters
- Functional and non-functional requirements
- High-level design versus low-level design
- Common system design terminology

### Understanding Software Systems

- Clients, servers, and networks
- Frontend, backend, and databases
- APIs and communication between components
- Monolithic and distributed systems
- Request-response lifecycle

### How the Internet Works

- IP addresses and domain names
- DNS resolution
- HTTP and HTTPS
- TCP and UDP
- Ports, protocols, and packets
- Latency and bandwidth

### Requirements Gathering

- Identifying users and use cases
- Writing functional requirements
- Defining performance expectations
- Estimating traffic and storage
- Recognising constraints and assumptions
- Asking useful clarification questions

## Part II — Core Building Blocks

### Application Servers

- Server responsibilities
- Stateless and stateful services
- Vertical and horizontal scaling
- Server-side processing
- Handling concurrent requests

### Databases

- What databases do
- Relational databases
- NoSQL databases
- Tables, documents, keys, and records
- Primary and foreign keys
- Basic database selection

### Database Fundamentals

- CRUD operations
- Indexes
- Joins
- Transactions
- ACID properties
- Normalisation and denormalisation

### Caching

- Why caching improves performance
- Browser, application, and database caches
- Cache hits and misses
- Time-to-live
- Cache invalidation
- Common caching strategies

### Load Balancing

- Why load balancers are needed
- Distributing requests
- Round-robin routing
- Health checks
- Layer 4 and Layer 7 load balancing
- Load balancer failure considerations

### Content Delivery Networks

- CDN fundamentals
- Edge locations
- Static and dynamic content
- Reducing latency
- CDN caching
- Common CDN use cases

### APIs and Service Communication

- REST APIs
- HTTP methods and status codes
- Request and response formats
- JSON and serialisation
- API versioning
- Authentication basics

### Message Queues

- Synchronous and asynchronous processing
- Producers and consumers
- Queue-based workflows
- Background jobs
- Retries and failed messages
- Common queue use cases

## Part III — Reliability and Security

### Scalability Basics

- Understanding system load
- Scaling reads and writes
- Bottleneck identification
- Replication basics
- Partitioning basics
- Avoiding single points of failure

### Availability and Reliability

- Uptime and downtime
- Redundancy
- Failover
- Backups
- Recovery planning
- Graceful degradation

### Security Fundamentals

- Authentication and authorisation
- Password storage
- Encryption in transit and at rest
- Input validation
- Rate limiting
- Common web security risks

### Monitoring and Logging

- Application logs
- Metrics
- Alerts
- Health checks
- Error tracking
- Basic observability

## Part IV — Designing Simple Systems

### A Beginner's System Design Process

- Clarifying requirements
- Estimating scale
- Defining APIs
- Designing data models
- Drawing the architecture
- Identifying bottlenecks
- Discussing trade-offs

### Designing a URL Shortener

- Short URL generation
- Redirect handling
- Database design
- Caching popular links
- Expiration and analytics

### Designing a Paste-Sharing Service

- Creating and retrieving content
- Expiring pastes
- Storage design
- Access control
- Abuse prevention

### Designing a Basic File Storage Service

- File upload and download
- Metadata storage
- Object storage
- File size limits
- Access permissions

### Designing a Simple Chat Application

- Sending and receiving messages
- Message storage
- Online presence
- Polling versus WebSockets
- Basic delivery status

### Designing a Simple E-Commerce Store

- Product catalogue
- Shopping basket
- Orders
- Inventory
- Payments overview

### Beginner Design Review Checklist

- Requirement coverage
- Component responsibilities
- Data flow clarity
- Basic scalability
- Reliability considerations
- Security considerations

# 2. Intermediate System Design

## Part I — Scalable Architecture

### Review of System Design Fundamentals

- Requirements and constraints
- Capacity estimation
- High-level architecture
- Data modelling
- Trade-off analysis

### Scaling Web Applications

- Stateless services
- Horizontal scaling
- Reverse proxies
- Autoscaling
- Session management
- Connection pooling

### Advanced Load Balancing

- Routing algorithms
- Weighted routing
- Least-connections routing
- Consistent hashing
- Global load balancing
- Load balancer redundancy

### Service-Oriented and Microservice Architecture

- Monoliths and modular monoliths
- Service boundaries
- Domain-based decomposition
- Inter-service communication
- Service discovery
- Microservice trade-offs

### API Design at Scale

- REST design principles
- GraphQL fundamentals
- gRPC fundamentals
- Pagination
- Idempotency
- Rate limiting
- Backward compatibility

## Part II — Data Systems

### Relational Database Design

- Schema design
- Index selection
- Query optimisation
- Transactions and isolation levels
- Read replicas
- Connection management

### NoSQL Database Patterns

- Key-value stores
- Document databases
- Wide-column databases
- Graph databases
- Access-pattern-driven design
- Choosing the correct database model

### Database Replication

- Leader-follower replication
- Multi-leader replication
- Leaderless replication
- Replication lag
- Read-after-write consistency
- Failure handling

### Database Partitioning and Sharding

- Horizontal and vertical partitioning
- Range-based sharding
- Hash-based sharding
- Directory-based sharding
- Rebalancing
- Hot partitions

### Distributed Caching

- Cache-aside
- Read-through caching
- Write-through caching
- Write-back caching
- Distributed cache clusters
- Cache stampedes
- Eviction policies

### Search Systems

- Inverted indexes
- Full-text search
- Tokenisation
- Ranking and relevance
- Search indexing pipelines
- Search consistency

### Object and Blob Storage

- Object storage architecture
- Metadata management
- Multipart uploads
- Replication and durability
- Lifecycle policies
- Signed URLs

## Part III — Distributed Communication

### Message Brokers and Event Streaming

- Queues versus streams
- Topics and partitions
- Consumer groups
- Message ordering
- Delivery guarantees
- Dead-letter queues

### Event-Driven Architecture

- Events and commands
- Event producers and consumers
- Eventual consistency
- Event schemas
- Event versioning
- Event-driven workflows

### Real-Time Communication

- Polling
- Long polling
- Server-Sent Events
- WebSockets
- Push notifications
- Connection management

### Background Processing

- Job queues
- Worker pools
- Scheduled jobs
- Retry policies
- Idempotent workers
- Long-running tasks

### Workflow and Orchestration Patterns

- Multi-step workflows
- Orchestration versus choreography
- Saga pattern
- Compensation actions
- Workflow state
- Failure recovery

## Part IV — Reliability and Operations

### Consistency and Availability

- Strong consistency
- Eventual consistency
- Causal consistency
- Quorum reads and writes
- CAP theorem
- PACELC trade-offs

### Fault-Tolerant Design

- Timeouts
- Retries
- Exponential backoff
- Circuit breakers
- Bulkheads
- Fallbacks
- Graceful degradation

### Observability

- Structured logging
- Metrics
- Distributed tracing
- Correlation identifiers
- Service-level indicators
- Alert design

### Deployment Architecture

- Rolling deployments
- Blue-green deployments
- Canary releases
- Feature flags
- Rollbacks
- Database migrations

### Security for Distributed Systems

- Identity and access management
- OAuth 2.0 and OpenID Connect
- API gateways
- Secrets management
- Service-to-service authentication
- Audit logging

## Part V — Intermediate Case Studies

### Designing a Social Media Feed

- Post creation
- Follower relationships
- Fan-out on write
- Fan-out on read
- Feed ranking
- Celebrity-user problem

### Designing a Notification System

- Email, SMS, push, and in-app channels
- User preferences
- Templates
- Scheduling
- Delivery tracking
- Deduplication

### Designing a Video Streaming Service

- Video upload
- Transcoding
- Metadata
- Adaptive bitrate streaming
- CDN distribution
- Playback analytics

### Designing a Ride-Hailing Service

- Driver location updates
- Geospatial indexing
- Driver-rider matching
- Trip lifecycle
- Pricing
- Real-time communication

### Designing an Online Marketplace

- Listings
- Search
- Inventory
- Orders
- Payments
- Seller management

### Designing a Collaborative Document Editor

- Document storage
- Real-time editing
- Version history
- Conflict resolution
- Presence indicators
- Access control

### Intermediate Design Review Checklist

- Scalability
- Consistency
- Failure scenarios
- Data ownership
- Operational complexity
- Cost and maintainability

# 3. Advanced System Design

## Part I — Distributed Systems Theory

### Distributed Systems Foundations

- Partial failures
- Network uncertainty
- Clock assumptions
- Safety and liveness
- Distributed state
- System models

### Time and Ordering

- Physical clocks
- Clock drift
- Network Time Protocol
- Lamport clocks
- Vector clocks
- Hybrid logical clocks
- Causal ordering

### Consensus

- Consensus requirements
- Leader election
- Quorums
- Paxos overview
- Raft
- Split-brain prevention
- Membership changes

### Distributed Transactions

- Local and distributed transactions
- Two-phase commit
- Three-phase commit
- Transaction coordinators
- Saga pattern
- Transactional outbox
- Dual-write problem

### Advanced Consistency Models

- Linearizability
- Serialisability
- Snapshot isolation
- Sequential consistency
- Causal consistency
- Session consistency
- Tunable consistency

### Conflict Resolution

- Last-write-wins
- Version vectors
- Optimistic concurrency control
- Conflict-free replicated data types
- Application-level conflict handling
- Merge strategies

## Part II — Large-Scale Data Architecture

### Large-Scale Storage Engines

- B-trees and B+ trees
- Log-structured merge trees
- Write-ahead logs
- Memtables
- SSTables
- Compaction
- Bloom filters

### Distributed Database Internals

- Metadata services
- Partition placement
- Replication protocols
- Rebalancing
- Failure detection
- Repair and anti-entropy

### Advanced Sharding

- Virtual nodes
- Consistent hashing rings
- Dynamic partitioning
- Cross-shard queries
- Secondary indexes
- Resharding at scale
- Tenant-aware partitioning

### Data Lakes, Warehouses, and Lakehouses

- Transactional and analytical workloads
- ETL and ELT
- Columnar storage
- Data partitioning
- Schema evolution
- Batch and streaming integration

### Distributed Stream Processing

- Event time and processing time
- Windows
- Watermarks
- Stateful stream processing
- Checkpointing
- Exactly-once processing
- Late-arriving data

### Change Data Capture

- Database logs
- CDC pipelines
- Data synchronisation
- Cache and search-index updates
- Schema changes
- Recovery and replay

### Data Governance and Lineage

- Data ownership
- Data classification
- Metadata catalogues
- Data lineage
- Retention policies
- Privacy controls

## Part III — High-Performance Architecture

### Performance Engineering

- Latency budgets
- Throughput analysis
- Queueing theory
- Tail latency
- Backpressure
- Capacity planning
- Performance profiling

### High-Scale Caching

- Multi-level caches
- Distributed invalidation
- Hot-key mitigation
- Cache warming
- Probabilistic caching
- Edge caching
- Consistency trade-offs

### Global and Multi-Region Systems

- Active-passive architecture
- Active-active architecture
- Geo-replication
- Data residency
- Traffic routing
- Regional isolation
- Disaster recovery

### High-Availability Architecture

- Failure domains
- Availability zones
- Regional failures
- Redundancy planning
- Recovery time objectives
- Recovery point objectives
- Chaos testing

### Rate Limiting and Traffic Management

- Token bucket
- Leaky bucket
- Sliding windows
- Distributed rate limiting
- Admission control
- Load shedding
- Priority queues

### Advanced Networking

- Layer 4 and Layer 7 routing
- Anycast
- Border Gateway Protocol concepts
- Service meshes
- Connection multiplexing
- TLS termination
- Network policies

## Part IV — Platform and Cloud Architecture

### Container and Orchestration Architecture

- Container isolation
- Cluster architecture
- Scheduling
- Service discovery
- Autoscaling
- Persistent storage
- Cluster failure handling

### Service Mesh Architecture

- Sidecar proxies
- Traffic policies
- Mutual TLS
- Retries and timeouts
- Telemetry
- Mesh operational costs

### Serverless System Design

- Functions as a service
- Event-driven execution
- Cold starts
- Statelessness
- Workflow orchestration
- Serverless data services
- Cost trade-offs

### Multi-Tenant Architecture

- Shared and isolated tenancy
- Tenant-aware data models
- Noisy-neighbour problems
- Resource quotas
- Tenant-specific configuration
- Security isolation

### Platform Engineering

- Internal developer platforms
- Golden paths
- Self-service infrastructure
- Platform APIs
- Developer portals
- Platform reliability

## Part V — Security, Resilience, and Governance

### Zero-Trust Architecture

- Continuous verification
- Identity-aware access
- Network segmentation
- Device trust
- Service identities
- Policy enforcement

### Threat Modelling

- Assets and trust boundaries
- Attack surfaces
- STRIDE
- Abuse cases
- Security controls
- Residual risk

### Resilience Engineering

- Failure injection
- Chaos experiments
- Dependency failures
- Regional evacuation
- Game days
- Resilience measurement

### Site Reliability Engineering

- Service-level objectives
- Error budgets
- Toil reduction
- Incident response
- Post-incident reviews
- Reliability governance

### Cost-Aware Architecture

- Cost modelling
- Unit economics
- Storage and compute costs
- Data transfer costs
- Reserved and on-demand capacity
- FinOps practices

## Part VI — Advanced Case Studies

### Designing a Global Payment Platform

- Payment lifecycle
- Idempotency
- Ledger architecture
- Reconciliation
- Fraud detection
- Multi-region processing
- Regulatory considerations

### Designing a Distributed Search Engine

- Web crawling
- Document processing
- Distributed indexing
- Query execution
- Ranking
- Index updates

### Designing a Global Messaging Platform

- Message routing
- Ordering guarantees
- Offline delivery
- Multi-device synchronisation
- Presence
- End-to-end encryption

### Designing a Large-Scale Metrics Platform

- Metrics ingestion
- Time-series storage
- Downsampling
- Aggregation
- Querying
- Alert evaluation

### Designing a Cloud Storage Platform

- Metadata architecture
- Blob placement
- Replication
- Erasure coding
- Versioning
- Global access

### Designing an Advertising Platform

- Campaign management
- Audience targeting
- Real-time bidding
- Budget control
- Attribution
- Fraud prevention

### Designing a Recommendation Platform

- Event collection
- Feature pipelines
- Candidate generation
- Ranking
- Online serving
- Experimentation

### Designing a Distributed Job Scheduler

- Job submission
- Resource allocation
- Leader election
- Job retries
- Dependency graphs
- Fairness and priorities

### Advanced Architecture Review Checklist

- Correctness
- Availability
- Consistency
- Scalability
- Security
- Operability
- Cost
- Organisational fit

# 4. System Design for the Workplace

## Part I — Applying System Design in Organisations

### System Design in a Professional Environment

- How workplace design differs from interviews
- Business requirements and technical requirements
- Stakeholders and decision-makers
- Legacy-system constraints
- Delivery timelines
- Organisational context

### Turning Business Problems into Technical Requirements

- Understanding the business objective
- Identifying users and stakeholders
- Mapping business workflows
- Defining success metrics
- Discovering hidden requirements
- Separating needs from proposed solutions

### Stakeholder Communication

- Communicating with product managers
- Working with engineering teams
- Collaborating with security and compliance teams
- Presenting to senior leadership
- Explaining technical trade-offs
- Managing conflicting priorities

### Writing Effective Design Documents

- Problem statement
- Background and context
- Goals and non-goals
- Requirements
- Proposed architecture
- Alternatives considered
- Risks and mitigations
- Rollout and operational plans

### Architecture Diagrams

- Context diagrams
- Container diagrams
- Component diagrams
- Sequence diagrams
- Data-flow diagrams
- Deployment diagrams
- Keeping diagrams current

## Part II — Design and Decision-Making

### Architecture Decision Records

- Capturing technical decisions
- Recording context
- Documenting alternatives
- Explaining consequences
- Revisiting previous decisions
- Maintaining a decision history

### Running Design Reviews

- Preparing for a review
- Choosing reviewers
- Asking productive questions
- Handling disagreement
- Tracking action items
- Approving or revising a design

### Evaluating Trade-Offs

- Build versus buy
- Speed versus quality
- Simplicity versus flexibility
- Consistency versus availability
- Cost versus performance
- Short-term versus long-term needs

### Proofs of Concept and Technical Spikes

- Identifying risky assumptions
- Defining success criteria
- Limiting scope
- Measuring results
- Avoiding prototype-to-production mistakes
- Communicating findings

### Technology Selection

- Evaluating databases
- Selecting frameworks
- Choosing cloud services
- Assessing vendor maturity
- Portability and lock-in
- Team skills and supportability

## Part III — Building and Evolving Production Systems

### Working with Existing Systems

- Understanding legacy architecture
- Reading undocumented codebases
- Dependency mapping
- Identifying technical debt
- Finding safe change boundaries
- Incremental modernisation

### Migration Strategies

- Strangler fig pattern
- Parallel systems
- Dual writes
- Data backfills
- Shadow traffic
- Cutover planning
- Rollback planning

### Database Schema Changes

- Backward-compatible changes
- Expand-and-contract migrations
- Online schema changes
- Backfilling data
- Validating migration results
- Rolling back safely

### API Evolution

- Versioning
- Deprecation
- Consumer communication
- Compatibility testing
- Contract testing
- Migration timelines

### Release and Rollout Planning

- Feature flags
- Phased rollouts
- Canary releases
- Monitoring during rollout
- Rollback criteria
- Post-release validation

### Production Readiness Reviews

- Capacity
- Monitoring
- Alerting
- Security
- Documentation
- Failure recovery
- Support ownership

## Part IV — Reliability and Operations

### Defining Service-Level Objectives

- User-facing reliability
- Service-level indicators
- Service-level objectives
- Service-level agreements
- Error budgets
- Reporting reliability

### Monitoring Production Systems

- Golden signals
- Business metrics
- Technical metrics
- Dashboards
- Alerts
- Distributed tracing
- Log management

### On-Call and Incident Response

- On-call responsibilities
- Incident severity levels
- Incident command
- Communication channels
- Mitigation and recovery
- Status updates
- Escalation

### Post-Incident Reviews

- Blameless analysis
- Building timelines
- Identifying contributing factors
- Root-cause analysis limitations
- Corrective actions
- Tracking follow-up work

### Capacity Planning

- Traffic forecasting
- Seasonal demand
- Headroom
- Load testing
- Scaling thresholds
- Capacity-related failure scenarios

### Disaster Recovery and Business Continuity

- Backup strategy
- Recovery testing
- Regional failover
- Recovery objectives
- Business-critical dependencies
- Disaster simulations

## Part V — Security, Compliance, and Risk

### Security Reviews

- Threat modelling
- Trust boundaries
- Authentication and authorisation
- Secrets management
- Encryption
- Auditability

### Privacy by Design

- Personal data identification
- Data minimisation
- Consent
- Retention and deletion
- Data access requests
- Privacy impact assessments

### Compliance-Aware Architecture

- Regulatory requirements
- Evidence collection
- Access controls
- Audit logs
- Data residency
- Segregation of duties

### Third-Party and Vendor Risk

- Vendor assessment
- Availability guarantees
- Security posture
- Data ownership
- Exit planning
- Dependency failure planning

## Part VI — Team and Organisational Architecture

### Ownership and Service Boundaries

- Defining service owners
- Team boundaries
- Domain ownership
- Shared services
- Escalation paths
- Avoiding unclear ownership

### Conway's Law and Organisational Design

- How team structures influence systems
- Communication paths
- Team topology
- Platform teams
- Stream-aligned teams
- Reducing cross-team dependencies

### Technical Debt Management

- Identifying debt
- Measuring impact
- Prioritising remediation
- Preventing uncontrolled growth
- Communicating debt to leadership
- Balancing debt and product delivery

### Architecture Governance

- Standards and guidelines
- Review boards
- Reference architectures
- Approved technologies
- Exceptions
- Avoiding excessive bureaucracy

### Mentoring and Design Leadership

- Giving design feedback
- Developing junior engineers
- Facilitating technical discussions
- Resolving disagreements
- Delegating design ownership
- Building architectural judgement

## Part VII — Planning and Delivery

### Estimating System Design Work

- Breaking designs into milestones
- Identifying unknowns
- Estimating integration work
- Accounting for operational readiness
- Managing dependencies
- Communicating uncertainty

### Cross-Team Project Design

- Shared requirements
- Interface agreements
- Dependency planning
- Joint testing
- Rollout coordination
- Ownership after launch

### Cost and Budget Management

- Infrastructure cost estimation
- Cost allocation
- Usage forecasting
- Cost-performance trade-offs
- FinOps collaboration
- Cost optimisation reviews

### Measuring Architecture Outcomes

- Reliability improvements
- Delivery speed
- Operational burden
- Customer impact
- Developer productivity
- Cost efficiency

## Part VIII — Workplace Case Studies

### Modernising a Legacy Monolith

- Current-state assessment
- Target architecture
- Service extraction
- Data migration
- Incremental rollout
- Risk management

### Launching a New Internal Platform

- Developer requirements
- Self-service workflows
- Platform APIs
- Adoption strategy
- Support model
- Success metrics

### Migrating a System to the Cloud

- Application inventory
- Migration strategies
- Network design
- Identity and access
- Data migration
- Cost control
- Operational transition

### Preparing a Service for Rapid Growth

- Bottleneck analysis
- Load testing
- Capacity planning
- Database scaling
- Caching
- Reliability improvements

### Replacing a Critical Vendor

- Dependency analysis
- Alternative evaluation
- Migration architecture
- Parallel operation
- Cutover
- Contract and operational considerations

### Designing a Multi-Team Event Platform

- Domain boundaries
- Event contracts
- Schema governance
- Ownership
- Observability
- Failure handling

### Responding to a Major Production Incident

- Detection
- Incident coordination
- Customer communication
- Mitigation
- Recovery
- Post-incident actions

### Presenting an Architecture Proposal to Leadership

- Business context
- Recommended approach
- Costs
- Risks
- Expected benefits
- Decision request

### Workplace System Design Checklist

- Business alignment
- Technical feasibility
- Security and compliance
- Operational readiness
- Cost sustainability
- Clear ownership
- Migration safety
- Measurable outcomes
