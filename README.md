# Congeal

A secure, encrypted organization tool for managing groups and items with customizable views.

## First-Time Setup

The first time the app loads in a browser, you will be prompted to create an admin account. There is also an option to seed the database with some example data, which serves as a guide to using the app.

## Starting the App

### Running with Docker Compose (Recommended)
1. Clone the repository
2. Copy `.env.example` to `.env` and configure your environment variables
3. Run: `docker-compose up -d`

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

### Running Locally
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure your environment variables
4. Run development server: `npm run dev`
5. Or build and run production: `npm run build && npm start`

## Environment Variables for Email

To enable password reset and admin notifications via email:

| Variable             | Description                                   | Example Value            |
|---------------------|-----------------------------------------------|-------------------------|
| `RELAY_SERVER`      | SMTP relay server hostname                    | `mail.example.com`      |
| `RELAY_PORT`        | SMTP port (usually 587 for TLS)              | `587`                   |
| `RELAY_ACCOUNT`     | SMTP authentication username                  | `user@example.com`      |
| `RELAY_PASSWORD`    | SMTP authentication password                  | `your-smtp-password`    |
| `MAIL_FROM_ADDRESS` | Sender email address                         | `no-reply@example.com`  |
| `MAIL_REPLY_TO`     | Reply-to address (optional)                  | `support@example.com`   |
| `MAIL_FROM_NAME`    | Sender name (optional)                       | `Congeal`               |

### Email Configuration Notes:

1. **Required Setup**
   - All variables except MAIL_REPLY_TO and MAIL_FROM_NAME are required
   - SMTP server must support TLS encryption
   - Email features are disabled if not configured

2. **Security Best Practices**
   - Use app-specific passwords when possible
   - Store credentials securely in production
   - Never commit credentials to version control
   - TLS verification is enabled by default

3. **Rate Limiting**
   - Maximum 5 messages per second
   - Connection pooling enabled
   - Maximum 5 concurrent connections

Example `.env` file:
```env
# Email Configuration
RELAY_SERVER=mail.example.com
RELAY_PORT=587
RELAY_ACCOUNT=user@example.com
RELAY_PASSWORD=your-smtp-password
MAIL_FROM_ADDRESS=no-reply@example.com
MAIL_REPLY_TO=support@example.com
MAIL_FROM_NAME=Congeal

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Key Features

- Secure authentication with password reset
- Encrypted data storage
- Group management with drag-and-drop
- Multiple view modes (grid, list, expanded)
- Dark/light theme
- Private groups
- Email notifications
- Database backup/restore
- Multi-language support (English/Japanese)

## Security Features

- JWT tokens in HTTP-only cookies
- Bcrypt password hashing
- Database encryption at rest
- Protected API routes
- TLS email encryption
- Rate limiting
- Input validation

## Contributing

1. Create a feature branch
2. Make changes
3. Run tests: `npm test`
4. Submit pull request

## License

GPLv3 License - See LICENSE file for details

For issues and feature requests, please use the GitHub issue tracker.