#!/bin/bash
set -e

# Check if all required email variables are set
if [ -n "$POSTFIX_SERVER" ] && [ -n "$POSTFIX_PORT" ] && [ -n "$POSTFIX_ACCOUNT" ] && [ -n "$POSTFIX_PASSWORD" ]; then
  echo "Configuring Postfix mail service..."
  
  # Set root's email alias to use MAIL_FROM_ADDRESS
  echo "root: ${MAIL_FROM_ADDRESS}" > /etc/aliases
  newaliases

  # Generate Postfix main.cf
  cat <<EOL > /etc/postfix/main.cf
# Basic Postfix configuration
inet_interfaces = all
mydestination = localhost.localdomain, localhost
myhostname = localhost

# SMTP Relay Configuration
relayhost = [$POSTFIX_SERVER]:$POSTFIX_PORT

# Authentication
smtp_sasl_auth_enable = yes
smtp_sasl_security_options = noanonymous
smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
smtp_sasl_mechanism_filter = plain, login

# TLS Settings
smtp_use_tls = yes
smtp_tls_security_level = encrypt
smtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt
smtp_tls_session_cache_database = btree:/var/lib/postfix/smtp_tls_session_cache
smtp_tls_wrappermode = no

# Network Settings
mynetworks = 127.0.0.0/8 [::1]/128 172.16.0.0/12 192.168.0.0/16
mailbox_size_limit = 0
message_size_limit = 52428800

# Debugging (comment out in production)
debug_peer_level = 2
debug_peer_list = $POSTFIX_SERVER
EOL

  # Generate SASL password map file
  echo "[$POSTFIX_SERVER]:$POSTFIX_PORT $POSTFIX_ACCOUNT:$POSTFIX_PASSWORD" > /etc/postfix/sasl_passwd

  # Set proper permissions for security
  chmod 600 /etc/postfix/sasl_passwd

  # Generate hashed SASL password map
  postmap /etc/postfix/sasl_passwd

  # Install CA certificates if not present
  apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

  # Create necessary directories
  mkdir -p /var/lib/postfix/smtp_tls_session_cache
  chown -R postfix:postfix /var/lib/postfix

  # Start Postfix service
  service postfix start
  
  echo "Postfix mail service configured and started"
  
  # Show configuration for debugging
  postconf -n
else
  echo "Email environment variables not set - mail service disabled"
fi

# Execute the main container command
exec "$@"
