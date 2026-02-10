# Group 9 Project Proposal: Map-based Customer Relationship Management (CRM) for Business-to-Business Salespeople
Project by: Raghav Sharma, Roman Nekrasov, Shradha Shankar

## Project Description

### Who is your target audience? Who do you envision using your application?

The target audience for this application is sales teams that operate within a shared organization, specifically salespeople and sales managers who manage business relationships tied to physical locations. We envision users who work in geographically defined territories and need a simple way to organize and manage businesses they interact with. Salespeople use the application to track the businesses they personally manage, while sales managers use it to view and manage all businesses associated with their organization. Both roles interact with the same core interface, but with different levels of access based on responsibility.

### Why does your audience want to use your application?

The audience wants to use this application because it provides a clear and intuitive way to organize business data around real-world locations rather than abstract lists. By representing businesses as pins on a map, users can visually understand where their accounts / sales  leads are located and easily access related information. The application allows users to create businesses, attach contacts, tasks, and activity records, and maintain structured data within a shared organization. Role-based access ensures that salespeople can manage only their own leads, while managers can oversee and edit all businesses within the organization. This structure supports accountability, prevents duplicated work, and keeps data organized in a way that aligns with how teams actually operate.

### Why do you as developers want to build this application?

We want to build this application because it provides a strong opportunity to design and implement a complete server-side system with realistic constraints. One of our members has worked in sales and wishes software like this existed. The project allows us to work with user authentication, role-based authorization, relational data modeling, and persistent storage while keeping the user interface intentionally simple. By focusing on accounts, users, permissions, and structured data relationships, we can demonstrate a solid understanding of server-side development concepts and how they support real-world applications.

## Technical Description



### Architectural Diagram



### Data Flow



### Summary Table for User Stories

| Priority | User               | Description                                                                                    | Technical Implementation                                                                                                                                                  |
| -------- | ------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | As a user          | I want to be able to create an account and log in so I can access the application securely.    | Implement authentication using a backend REST API. User credentials are validated on login and a session or JWT token is issued. User records are stored in the database. |
| P0       | As a user          | I want to belong to an organization (account) so my data is isolated from other organizations. | Create an Account record in the database and associate users with an `accountId`. All queries are scoped by `accountId` on the server.                                    |
| P0       | As a salesperson   | I want to view a map with businesses I own so I can manage my territory.                       | When loading the map, the client sends a request to the server. The server queries the Businesses table filtered by `accountId` and `ownerUserId`.                        |
| P0       | As a sales manager | I want to view all businesses in my organization so I can oversee the team.                    | The server checks the user’s role. If the role is manager, it queries all Businesses for the account without filtering by owner.                                          |
| P0       | As a user          | I want to drop a pin on the map to create a business at a specific location.                   | The client sends latitude, longitude, and business data to a POST endpoint. The server validates the request and inserts the business into the database.                  |
| P0       | As a user          | I want to open a business from the map and view its details.                                   | The client requests business details by ID. The server verifies account and ownership permissions before returning the business data.                                     |
| P0       | As a user          | I want to add contacts to a business so I can track who I interact with.                       | The server provides endpoints to create and retrieve contacts associated with a business ID. Contacts are stored in the database with foreign keys.                       |
| P0       | As a user          | I want to create tasks for a business so I can track next actions.                             | Implement task CRUD endpoints. Tasks are linked to a business and optionally assigned to a user.                                                                          |
| P0       | As a user          | I want to log activities for a business so I can track past interactions.                      | Activity records are created through a backend endpoint and stored with timestamps and user references.                                                                   |
| P0       | As a sales manager | I want to edit any business in my organization.                                                | The server enforces role-based access control, allowing managers to update any business in their account.                                                                 |
| P1       | As a salesperson   | I want to edit or delete my own businesses so I can keep my data accurate.                     | The server allows updates and deletions only if the authenticated user is the business owner.                                                                             |
| P1       | As a sales manager | I want to reassign a business to another salesperson.                                          | Provide an endpoint that allows managers to update the `ownerUserId` field of a business.                                                                                 |
| P1       | As a user          | I want to view tasks by status so I can prioritize my work.                                    | The server supports query parameters to filter tasks by status (e.g., open or completed).                                                                                 |
| P2       | As a user          | I want to search businesses by name so I can find them quickly.                                | Implement server-side filtering using query parameters and database search operations.                                                                                    |
| P2       | As a user          | I want to filter businesses by owner so I can review assignments.                              | Add optional query parameters to business endpoints for owner-based filtering.                                                                                            |
| P3       | As a sales manager | I want to view activity summaries by user so I can evaluate performance.                       | Aggregate activity data on the server using grouped database queries.                                                                                                     |
| P4       | As a user          | I want live updates when businesses are added or edited.                                       | Use WebSockets or server-sent events to push updates to connected clients (stretch goal).                                                                                 |


### API Endpoints

#### Authentication
- **POST** `/auth/register` - Allows a user to create a new account and initial user.
- **POST** `/auth/login` - Allows a user to log into their account and receive an authentication token.
- **GET** `/auth/me` - Returns information about the currently authenticated user.

#### Users
- **GET** `/users` - Retrieves all users in the current account (manager only).
- **POST** `/users` - Creates a new user within the current account (manager only).
- **PATCH** `/users/:id/role` - Updates the role of a user (manager only).

#### Businesses
- **GET** `/businesses` - Retrieves all businesses visible to the user.
  - Salesperson: only owned businesses
  - Manager: all businesses in the account
- **POST** `/businesses` - Creates a new business with map coordinates.
- **GET** `/businesses/:id` - Retrieves information for a specific business.
- **PUT** `/businesses/:id` - Updates business information (role-based access enforced).
- **DELETE** `/businesses/:id` - Deletes a business (role-based access enforced).
- **PATCH** `/businesses/:id/owner` - Reassigns a business to a different salesperson (manager only).

#### Contacts
- **GET** `/businesses/:id/contacts` - Retrieves all contacts associated with a business.
- **POST** `/businesses/:id/contacts` - Adds a new contact to a business.
- **PUT** `/contacts/:id` - Updates contact information.
- **DELETE** `/contacts/:id` - Deletes a contact.

#### Tasks
- **GET** `/businesses/:id/tasks` - Retrieves all tasks associated with a business.
- **POST** `/businesses/:id/tasks` - Creates a new task for a business.
- **PUT** `/tasks/:id` - Updates task information or status.
- **DELETE** `/tasks/:id` - Deletes a task.
- **GET** `/tasks` - Retrieves tasks with optional filters (status, assigned user).

#### Activities
- **GET** `/businesses/:id/activities` - Retrieves all activity records for a business.
- **POST** `/businesses/:id/activities` - Creates a new activity record.
- **DELETE** `/activities/:id` - Deletes an activity record.

### Database Schemas

#### Accounts
- `id` (ID)
- `name` (String)
- `createdAt` (Date)

#### Users
- `id` (ID)
- `accountId` (ID)
- `email` (String)
- `passwordHash` (String)
- `fullName` (String)
- `role` (String)
- `createdAt` (Date)

#### Businesses
- `id` (ID)
- `accountId` (ID)
- `ownerUserId` (ID)
- `name` (String)
- `address` (String)
- `latitude` (Number)
- `longitude` (Number)
- `notes` (String)
- `createdAt` (Date)
- `updatedAt` (Date)

#### Contacts
- `id` (ID)
- `accountId` (ID)
- `businessId` (ID)
- `name` (String)
- `email` (String)
- `phone` (String)
- `title` (String)
- `createdAt` (Date)

#### Tasks
- `id` (ID)
- `accountId` (ID)
- `businessId` (ID)
- `assignedUserId` (ID)
- `title` (String)
- `status` (String)
- `dueDate` (Date)
- `createdAt` (Date)

#### Activities
- `id` (ID)
- `accountId` (ID)
- `businessId` (ID)
- `createdByUserId` (ID)
- `type` (String)
- `summary` (String)
- `createdAt` (Date)
