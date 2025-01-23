# Congeal

A secure, encrypted organization tool for managing groups and items with customizable views.

## First-Time Setup

The first time the app loads in a browser, you will be prompted to create an admin account. There is also an option to seed the database with some example data, which serves as a guide to using the app.


## Starting the App

### Running with Docker Compose (Recommended)
1. Clone the repository
2. Run the following command to start the container:
docker-compose up -d

The app will be available at http://localhost:3000

### Running with Docker
1. Clone the repository
2. Build and start the container:
```bash
# Build the Docker image
docker build -t congeal .  

# Start the container
docker run -p 3000:3000 congeal
```
3. Show running containers
docker ps -a


## Docker Configuration

The project includes Docker support with:
- Dockerfile: Node.js 18 slim image with minimal dependencies
- docker-compose.yml: Container orchestration with:
  - Persistent volumes for database and snapshots
  - Environment configuration
  - Automatic restart policy
  - Port mapping (3000)

Docker-specific features:
- Multi-stage build for smaller image size
- Production-optimized Node.js configuration
- Automatic TypeScript checks skipping in production
- Volume mounts for persistent data
- Health checks and graceful shutdown

### Running Locally
1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Or build and run production: `npm run build && npm start`


## Key Features


### Authentication Flow
1. First-time setup shows an initialization modal
2. Admin creates initial username/password
3. Database encryption is set up using the password
4. Subsequent visits require login
5. JWT-based session management

### Database Security
- AES-256-GCM encryption
- Password-derived encryption key
- Salt-based key derivation
- Encrypted fields are marked with /// @encrypted in schema
- Encrypted tables and fields:
  - Groups:
    - name
    - iconName
  - Items:
    - name
    - description
    - status
    - iconName
  - Quotes:
    - quote
    - thinker
  - Settings:
    - Most fields marked with /// @encrypted: false for performance
    - Only sensitive settings are encrypted
- Non-encrypted tables:
  - Users (passwords are hashed with bcrypt instead)

### Group Management
- Create and organize groups
- Drag-and-drop interface
- Grid, list, and expanded view options
- View mode persistence per group
- View mode persistence for "Show All" and "Ungrouped" views
- Group icons and colors
- Support for solid icons
- Optional icons with color selection
- Private groups with password protection
- Group dividers for organization

### Settings
- Site title and tagline customization
- Header image upload
- Dark/light theme toggle
- Password management
- Database backup/restore
- Factory reset option
- Debug mode toggle for development
- Language selection (English/Japanese)
- Email integration toggle (alpha)

### Email Integration (Pre-Alpha)
- Optional IMAP email client integration
- Current features:
  - Connect to IMAP servers
  - View messages in list/condensed views
  - Mark messages as read/seen
  - View HTML and plain text emails
  - Show email headers and source
  - Message search
  - Mailbox organization with drag-and-drop
- Planned features:
  - Message reply and delete
  - Google OAuth 2.0 integration
  - Microsoft OAuth 2.0 integration
  - Message composition
  - Attachment handling
- Note: This feature is commented out in /src/app/settings/page.tsx

### Developer Tools
- Debug mode for monitoring operations
- Command and response logging
- System status indicators
- Real-time operation tracking
- Encrypted data protection

### Snapshot Management
- Create database backups as snapshots
- Download snapshots for external backup
- Restore system from snapshots
- Automatic snapshot cleanup
- Warning: Snapshots contain unencrypted data

### UI Features
- Timestamp display for group updates
- Consistent view mode toggle controls
- Responsive grid layouts:
  - Grid view: 1-4 columns
  - Expanded view: 2 columns
  - List view: Single column
- Notes and Quotes Manager
  - Create and edit notes with titles and tags
  - Tag-based filtering and search
  - Sort by newest/oldest/alphabetical
  - Keyboard shortcuts for common actions
  - Expandable/collapsible content
- Markdown support in descriptions
- Custom icon support with color options
- Due date management for items
- Floating due items notification

### State Management
- Zustand stores for global state
- Debug store for logging operations
- Settings store for app configuration
- Secure state management patterns
- localStorage persistence for:
  - Selected group ID
  - View mode preferences
  - Sort order preferences
  - UI state preferences

### Database Operations
- Prisma automatically handles encryption/decryption
- Sensitive fields are encrypted before storage
- Encryption key is derived from admin password
- No direct database access without proper authentication
- Non-sensitive settings bypass encryption for performance
- Notes table for storing formatted notes with tags
- Quotes table for inspirational content
- Support for due dates and reminders
- Custom icon names and color preferences

### API Routes
- `/api/auth/*` - Authentication endpoints
- Protected routes require valid JWT
- Rate limiting on sensitive endpoints
- Proper error handling without data leaks
- Auth rate limit: 5 attempts per 15 minutes
- General API rate limit: 100 requests per minute
- File upload size limit: 5MB

########################
## Development Notes
########################

### Database Operations
- Prisma automatically handles encryption/decryption
- Sensitive fields are encrypted before storage
- Encryption key is derived from admin password
- No direct database access without proper authentication
- Non-sensitive settings bypass encryption for performance

### API Routes
- `/api/auth/*` - Authentication endpoints
- Protected routes require valid JWT
- Rate limiting on sensitive endpoints
- Proper error handling without data leaks
- Auth rate limit: 5 attempts per 15 minutes
- General API rate limit: 100 requests per minute
- File upload size limit: 5MB

### State Management
- Zustand stores for global state
- Debug store for logging operations
- Settings store for app configuration
- Secure state management patterns
+ localStorage persistence for:
+   - Selected group ID
+   - View mode preferences

### UI Optimizations
- Optimistic updates to prevent scroll jumps
- Implementation:
  1. Update SWR cache immediately with expected data
  2. Disable automatic revalidation
  3. Use populateCache option for smooth transitions
  4. Only revalidate on error to maintain consistency
  Example:
  ```
  mutate(
    currentItems => currentItems?.map(i => 
      i.id === itemId ? updatedItem : i
    ),
    {
      revalidate: false,
      populateCache: true
    }
  )
  ```


## First-Time Setup

When first accessing the application:
1. The initialization modal appears
2. Create admin credentials (username/password)
3. Password is used to generate encryption keys
4. Database is initialized with encrypted settings
5. Demo content is created (example groups and quotes)
6. Redirected to login page
7. Login with created credentials


## Data Storage

### Local Storage

- **selectedGroupId** (string)
  - `"all"` (for Show All view)
  - `"ungrouped"` (for Ungrouped view)
  - `"{number}"` (specific group ID)
- **settings**
  - **allViewMode** (`"grid"` | `"list"` | `"expanded"`)
  - **ungroupedViewMode** (`"grid"` | `"list"` | `"expanded"`)
  - **showPrivateGroups** (boolean)
- **quotesPageSortOrder** (`"newest"` | `"oldest"` | `"az"`)
- **quotesPageSize** (`10` | `20` | `50` | `100`)

---

### SQLite Database

#### Groups
- **id** (number, primary key)
- **name** (string) _@encrypted_
- **order** (number)
- **isDivider** (boolean)
- **isPrivate** (boolean)
- **iconName** (string, optional) _@encrypted_
- **iconColor** (string)
- **viewMode** (`"grid"` | `"list"` | `"expanded"`)
- **sortField** (`"order"` | `"createdAt"` | `"updatedAt"` | `"dueAt"`) _@encrypted_
- **sortDirection** (`"asc"` | `"desc"`) _@encrypted_
- **createdAt** (Date)
- **updatedAt** (Date)

#### Items
- **id** (number, primary key)
- **name** (string)
- **description** (string, optional)
- **status** (`"gray"` | `"red"` | `"yellow"` | `"green"` | `"blue"` | `"purple"`)
- **iconName** (string)
- **order** (number)
- **useStatusColor** (boolean)
- **dueAt** (Date, optional)
- **groupId** (number, foreign key, nullable)
- **createdAt** (Date)
- **updatedAt** (Date)

#### Notes
- **id** (number, primary key)
- **title** (string)
- **content** (string)
- **tags** (string) _Comma-separated tags_
- **createdAt** (Date)
- **updatedAt** (Date)

#### Quotes
- **id** (number, primary key)
- **quote** (string) _@encrypted_
- **thinker** (string) _@encrypted_
- **createdAt** (Date)
- **updatedAt** (Date)

#### Settings
- **id** (number, primary key)
- **title** (string)
- **tagline** (string)
- **isDark** (boolean)
- **headerImage** (string, optional)
- **headerEnabled** (boolean)
- **allViewMode** (`"grid"` | `"list"` | `"expanded"`)
- **ungroupedViewMode** (`"grid"` | `"list"` | `"expanded"`)
- **showPrivateGroups** (boolean)
- **version** (string)
- **debugMode** (boolean)
- **isPublic** (boolean)
- **language** (string)
- **emailEnabled** (boolean)
- **googleEnabled** (boolean)
- **outlookEnabled** (boolean)
- **updatedAt** (Date)

#### Users
- **id** (number, primary key)
- **username** (string, unique)
- **password** (string)
- **isAdmin** (boolean)
- **encryptionSalt** (string, optional)
- **createdAt** (Date)
- **updatedAt** (Date)

#### Mailboxes
- **id** (number, primary key)
- **name** (string)
- **iconName** (string, optional)
- **iconColor** (string, optional)
- **email** (string, optional)
- **imapHost** (string, optional)
- **imapPort** (number, optional)
- **username** (string, optional)
- **password** (string, optional)
- **useSSL** (boolean)
- **useOAuth** (boolean)
- **order** (number)
- **createdAt** (Date)
- **updatedAt** (Date)

#### Messages
- **id** (number, primary key)
- **subject** (string)
- **body** (string)
- **mailboxId** (number, foreign key)
- **createdAt** (Date)
- **updatedAt** (Date)


## Environment Variable Requirements for Lost Password Recovery

To enable password reset functionality via email, configure these environment variables:

| Variable             | Description                                   | Example Value            |
|---------------------|-----------------------------------------------|-------------------------|
| `POSTFIX_SERVER`    | SMTP server hostname                          | `mail.example.com`      |
| `POSTFIX_PORT`      | SMTP server port                             | `587`                   |
| `POSTFIX_ACCOUNT`   | SMTP authentication username/email            | `user@example.com`      |
| `POSTFIX_PASSWORD`  | SMTP authentication password                  | `your-smtp-password`    |
| `MAIL_FROM_ADDRESS` | Email address used as sender                  | `no-reply@example.com`  |
| `MAIL_REPLY_TO`     | Reply-to email address (optional)            | `support@example.com`   |

### Notes:

1. **Email Configuration**
   - All variables except MAIL_REPLY_TO are required for email functionality
   - If not configured, password reset feature will be disabled
   - SMTP server must support TLS encryption

2. **Docker Deployment**
   - Set variables in your `.env` file for local development
   - Configure through your deployment platform (e.g., Coolify) for production
   - Port 25 must be exposed for Postfix to function

3. **Security**
   - Use app-specific passwords for Gmail and other providers that support it
   - Store credentials securely in production environment
   - Never commit real credentials to version control

Example `.env` file:
```env
# Email Configuration
POSTFIX_SERVER=mail.example.com
POSTFIX_PORT=587
POSTFIX_ACCOUNT=user@example.com
POSTFIX_PASSWORD=your-smtp-password
MAIL_FROM_ADDRESS=no-reply@example.com
MAIL_REPLY_TO=support@example.com

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```


## Contributing

1. Create a feature branch
2. Make changes
3. Run tests: `npm test`
4. Submit pull request


## Security Considerations

- JWT tokens are HTTP-only cookies
- Passwords are hashed with bcrypt
- Database fields are encrypted at rest
- API routes are protected by middleware
- Password-based encryption key derivation


## License

GPLv3 License - See LICENSE file for details


For issues and feature requests, please use the GitHub issue tracker.