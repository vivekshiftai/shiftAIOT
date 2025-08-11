# Database Setup for shiftAIOT Platform

## Prerequisites
- PostgreSQL installed and running on localhost:5432
- PostgreSQL user with create database privileges

## Database Setup Steps

### 1. Database Setup
The application uses the existing `iotplatform` database. If you need to create it:

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database (if it doesn't exist)
CREATE DATABASE iotplatform;

-- Grant privileges (if using a different user)
GRANT ALL PRIVILEGES ON DATABASE iotplatform TO postgres;

-- Connect to the database
\c iotplatform
```

### 2. Automatic Table Creation
The application will automatically create all necessary tables when it starts up. The schema.sql file contains:

- **users** - User accounts and authentication
- **devices** - IoT devices and their configurations
- **rules** - Automation rules
- **rule_conditions** - Conditions for rules
- **rule_actions** - Actions to execute when rules are triggered
- **notifications** - User notifications
- **knowledge_documents** - Knowledge base documents

### 3. Default Data
The schema.sql also includes:
- Default admin user (admin@shiftaiot.com / admin123)
- Sample devices (Temperature and Humidity sensors)
- Sample rule for high temperature alerts

### 4. Environment Variables
Set these environment variables or use the defaults:

```bash
# Database
export DB_USERNAME=postgres
export DB_PASSWORD=Vivek@1234

# JWT
export JWT_SECRET=mySecretKey123456789012345678901234567890

# Email (optional)
export EMAIL_USERNAME=your-email@gmail.com
export EMAIL_PASSWORD=your-app-password

# InfluxDB (optional)
export INFLUX_URL=http://localhost:8086
export INFLUX_TOKEN=my-token
export INFLUX_ORG=shiftaiot
export INFLUX_BUCKET=telemetry

# MQTT (optional)
export MQTT_BROKER_URL=tcp://localhost:1883
export MQTT_USERNAME=
export MQTT_PASSWORD=

# OpenAI (optional)
export OPENAI_API_KEY=your-openai-api-key
```

### 5. Start the Application
```bash
cd backend
mvn spring-boot:run
```

The application will:
1. Connect to the PostgreSQL database
2. Execute schema.sql to create tables if they don't exist
3. Insert default data if it doesn't exist
4. Start the Spring Boot application

### 6. Verify Setup
- Check application logs for "✅ Successfully connected to PostgreSQL database"
- Access API documentation at: http://localhost:8100/api/swagger-ui.html
- Login with default admin: admin@shiftaiot.com / admin123

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running: `pg_ctl status`
2. Check database exists: `psql -U postgres -l`
3. Verify credentials in application.yml

### Table Creation Issues
1. Check schema.sql syntax
2. Ensure user has CREATE TABLE privileges
3. Check application logs for specific errors

### Port Conflicts
- Change server.port in application.yml if 8100 is in use
- Update frontend API configuration accordingly
